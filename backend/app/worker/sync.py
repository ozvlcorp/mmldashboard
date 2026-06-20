"""
sync_tenant — выполняет один цикл синхронизации для (widget, account).

Шаги:
  1. Берёт access_token из app_tokens
  2. Идёт в МойСклад: ассортимент + отгрузки за период
  3. Прогоняет данные через формулы (inventory/abc/xyz)
  4. Кладёт результат в mml_snapshots
  5. Обновляет mml_sync_state

В этой версии:
  - RFM считается пустым (порт RFM-формул и customer segments — в следующем PR)
  - debtors не синхронизируем (отдельный путь, тоже отдельно)
  - период жёстко 30 дней назад от сейчас (Phase 3 — настраиваемый)
"""
from __future__ import annotations

import dataclasses
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..analytics.abc import build_abc_report
from ..analytics.inventory import build_inventory_report
from ..analytics.rfm import build_rfm_report
from ..analytics.xyz import build_xyz_report
from ..models import AppToken, MmlSnapshot, MmlSyncState
from ..moysklad.client import MsClient
from ..moysklad.transform import (
    assortment_to_inventory,
    demands_to_abc,
    demands_to_rfm,
    demands_to_xyz,
)

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    """Naive UTC — для совместимости с DateTime без tz в моделях."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _to_jsonable(obj: Any) -> Any:
    """Превращает dataclass / list / dict в JSON-совместимое значение.
    math.inf конвертируется в строку 'Infinity' — JSONB на стороне PG не
    принимает Inf, на стороне JS — Number(JSON.parse('Infinity')) тоже.
    Безопасный сериализатор: Inf → null, NaN → null."""
    import math
    if dataclasses.is_dataclass(obj):
        return _to_jsonable(dataclasses.asdict(obj))
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_jsonable(x) for x in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj


async def sync_tenant(
    db: AsyncSession,
    widget_name: str,
    account_id: str,
    period_days: int = 30,
) -> dict[str, Any]:
    """
    Выполняет полную синхронизацию для (widget, account). Возвращает
    summary: {ok, snapshot_id, products_count, demands_count, took_ms}.
    Бросает исключение если что-то критично сломалось.
    """
    started = time.monotonic()
    until = _utcnow()
    from_ = until - timedelta(days=period_days)
    from_iso = from_.strftime("%Y-%m-%d %H:%M:%S")
    until_iso = until.strftime("%Y-%m-%d %H:%M:%S")

    # Mark sync as running
    await _save_sync_state(db, widget_name, account_id, status="running", error=None)

    try:
        # 1. Find token
        token_q = select(AppToken).where(
            AppToken.widget_name == widget_name,
            AppToken.account_id == account_id,
        )
        token_row = (await db.execute(token_q)).scalars().first()
        if not token_row:
            raise ValueError(f"no app_token for widget={widget_name} account={account_id}")

        # 2. Fetch from MoySklad in parallel
        import asyncio
        async with MsClient(token_row.access_token) as ms:
            tasks = [
                ms.fetch_assortment(),
                ms.fetch_demands(from_iso, until_iso),
                # retaildemand может 404 на аккаунтах без розницы — глотаем
                _safe(ms.fetch_demands(from_iso, until_iso, endpoint="/entity/retaildemand")),
            ]
            assortment, wholesale, retail = await asyncio.gather(*tasks)

        all_demands = (wholesale or []) + (retail or [])
        logger.info(
            "sync %s/%s: %d items, %d demands (wholesale %d, retail %d)",
            widget_name, account_id, len(assortment), len(all_demands),
            len(wholesale or []), len(retail or []),
        )

        # 3. Run analytics
        inv_inputs = assortment_to_inventory(assortment, all_demands, period_days=period_days)
        inv_report = build_inventory_report(inv_inputs, horizon_days=10)

        abc_inputs = demands_to_abc(all_demands)
        abc_rows = build_abc_report(abc_inputs)

        xyz_inputs = demands_to_xyz(all_demands, until=until)
        xyz_rows = build_xyz_report(xyz_inputs)

        rfm_txs = demands_to_rfm(all_demands)
        rfm_rows = build_rfm_report(rfm_txs, reference_date=until)

        # 4. Build JSONB payload — структура зеркалит AnalyticsResult из widget
        meta = {
            "periodDays": period_days,
            "from": from_.isoformat(),
            "to": until.isoformat(),
            "productsCount": len(assortment),
            "demandsCount": len(all_demands),
            "turnover": sum(d.get("sum", 0) or 0 for d in all_demands) / 100,
        }
        compute_ms = int((time.monotonic() - started) * 1000)

        # 5. Upsert snapshot
        stmt = insert(MmlSnapshot).values(
            widget_name=widget_name,
            account_id=account_id,
            store_id=None,
            period_from=from_,
            period_to=until,
            inventory=_to_jsonable([dataclasses.asdict(r) for r in inv_report.rows]),
            abc=_to_jsonable([dataclasses.asdict(r) for r in abc_rows]),
            xyz=_to_jsonable([dataclasses.asdict(r) for r in xyz_rows]),
            rfm=_to_jsonable([dataclasses.asdict(r) for r in rfm_rows]),
            debtors=None,
            meta=meta,
            products_count=len(assortment),
            demands_count=len(all_demands),
            compute_time_ms=compute_ms,
        )
        stmt = stmt.on_conflict_do_update(
            constraint="uq_mml_snapshots_key",
            set_={
                "snapshot_at": _utcnow(),
                "inventory": stmt.excluded.inventory,
                "abc": stmt.excluded.abc,
                "xyz": stmt.excluded.xyz,
                "rfm": stmt.excluded.rfm,
                "meta": stmt.excluded.meta,
                "products_count": stmt.excluded.products_count,
                "demands_count": stmt.excluded.demands_count,
                "compute_time_ms": stmt.excluded.compute_time_ms,
            },
        )
        await db.execute(stmt)

        # 6. Mark sync ok
        await _save_sync_state(db, widget_name, account_id, status="ok", error=None,
                               increment_count=True)
        await db.commit()

        return {
            "ok": True,
            "products_count": len(assortment),
            "demands_count": len(all_demands),
            "took_ms": compute_ms,
        }

    except Exception as e:
        logger.exception("sync failed for %s/%s", widget_name, account_id)
        await _save_sync_state(db, widget_name, account_id, status="error", error=str(e)[:500])
        await db.commit()
        raise


async def _save_sync_state(
    db: AsyncSession,
    widget_name: str,
    account_id: str,
    status: str,
    error: Optional[str],
    increment_count: bool = False,
):
    now = _utcnow()
    next_after = now + timedelta(minutes=30) if status == "ok" else now + timedelta(minutes=5)
    stmt = insert(MmlSyncState).values(
        widget_name=widget_name,
        account_id=account_id,
        last_sync_at=now if status != "running" else None,
        last_sync_status=status,
        last_error=error,
        next_sync_after=next_after if status != "running" else None,
        sync_count=1 if increment_count else 0,
    )
    set_ = {
        "last_sync_status": status,
        "last_error": error,
    }
    if status != "running":
        set_["last_sync_at"] = now
        set_["next_sync_after"] = next_after
    if increment_count:
        set_["sync_count"] = MmlSyncState.sync_count + 1
    stmt = stmt.on_conflict_do_update(
        index_elements=["widget_name", "account_id"],
        set_=set_,
    )
    await db.execute(stmt)


async def _safe(awaitable):
    """asyncio.gather-friendly: ловит исключение и возвращает [] вместо."""
    try:
        return await awaitable
    except Exception as e:
        logger.warning("optional fetch failed: %s", e)
        return []
