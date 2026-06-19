"""
Snapshot API — Phase 2.

Кешированный AnalyticsResult для MML-виджета. До появления worker'а
(Phase 2b) виджет может сам слать сюда свой результат после долгого
loadAnalytics — это превращает дашборд в self-warming cache: первый
пользователь ждёт 10-30с, все следующие открытия для этого account
≤500мс.

Эндпоинты:
- GET    /{widget_name}/snapshot              — последний снапшот
- GET    /{widget_name}/snapshot/status       — состояние синхронизации
- POST   /{widget_name}/snapshot              — записать снапшот (защищён)
- DELETE /{widget_name}/snapshot              — стереть все снапшоты тенанта
"""
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import AppToken, MmlSnapshot, MmlSyncState

router = APIRouter(tags=["Snapshot"])


# ── модели запроса/ответа ────────────────────────────────────────────────


class SnapshotIn(BaseModel):
    """Тело POST /{widget}/snapshot — то, что воркер (или сам виджет) кладёт."""
    period_from: datetime
    period_to: datetime
    store_id: Optional[str] = None
    inventory: list[Any]
    abc: list[Any]
    xyz: list[Any]
    rfm: list[Any]
    debtors: Optional[list[Any]] = None
    meta: dict[str, Any]
    products_count: int
    demands_count: int
    compute_time_ms: Optional[int] = None


class SnapshotOut(BaseModel):
    snapshot_at: datetime
    period_from: datetime
    period_to: datetime
    store_id: Optional[str]
    inventory: list[Any]
    abc: list[Any]
    xyz: list[Any]
    rfm: list[Any]
    debtors: Optional[list[Any]] = None
    meta: dict[str, Any]
    products_count: int
    demands_count: int


class StatusOut(BaseModel):
    has_snapshot: bool
    last_snapshot_at: Optional[datetime]
    last_sync_at: Optional[datetime]
    last_sync_status: Optional[str]
    last_error: Optional[str]
    next_sync_after: Optional[datetime]
    sync_count: int


# ── auth helpers ─────────────────────────────────────────────────────────


async def _check_account_authorized(
    db: AsyncSession, widget_name: str, account_id: str
) -> None:
    """
    Допускаем чтение/запись снапшота только если у нас есть валидный
    токен МойСклад для этой (widget, account) пары — значит виджет
    действительно установлен.
    """
    q = select(AppToken).where(
        AppToken.widget_name == widget_name,
        AppToken.account_id == account_id,
    )
    res = await db.execute(q)
    if res.scalars().first() is None:
        raise HTTPException(
            status_code=401,
            detail=f"widget '{widget_name}' is not installed for account '{account_id}'",
        )


def _check_admin(x_admin_secret: Optional[str]) -> None:
    """Защита write-эндпоинтов: пока — общий ADMIN_SECRET (как в admin.py).
    В Phase 3 заменим на per-tenant JWT, выпускаемый при context callback."""
    if not settings.admin_secret:
        # Если секрет не задан в env — write-эндпоинты открыты (dev mode).
        # В production обязательно ставить ADMIN_SECRET.
        return
    if x_admin_secret != settings.admin_secret:
        raise HTTPException(status_code=403, detail="invalid admin secret")


# ── endpoints ────────────────────────────────────────────────────────────


@router.get("/{widget_name}/snapshot", response_model=SnapshotOut)
async def get_snapshot(
    widget_name: str,
    account: str = Query(..., description="MoySklad accountId"),
    store: Optional[str] = Query(None, description="UUID склада, NULL = все"),
    db: AsyncSession = Depends(get_db),
):
    """Последний снапшот для (widget, account, store). 404 если нет."""
    await _check_account_authorized(db, widget_name, account)

    q = (
        select(MmlSnapshot)
        .where(
            MmlSnapshot.widget_name == widget_name,
            MmlSnapshot.account_id == account,
            MmlSnapshot.store_id.is_(store) if store is None else MmlSnapshot.store_id == store,
        )
        .order_by(desc(MmlSnapshot.snapshot_at))
        .limit(1)
    )
    res = await db.execute(q)
    snap = res.scalars().first()
    if snap is None:
        raise HTTPException(
            status_code=404,
            detail="no snapshot yet — first sync is in progress or not started",
        )
    return SnapshotOut(
        snapshot_at=snap.snapshot_at,
        period_from=snap.period_from,
        period_to=snap.period_to,
        store_id=snap.store_id,
        inventory=snap.inventory or [],
        abc=snap.abc or [],
        xyz=snap.xyz or [],
        rfm=snap.rfm or [],
        debtors=snap.debtors,
        meta=snap.meta or {},
        products_count=snap.products_count,
        demands_count=snap.demands_count,
    )


@router.get("/{widget_name}/snapshot/status", response_model=StatusOut)
async def get_snapshot_status(
    widget_name: str,
    account: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Состояние синхронизации — для бейджа «обновлено X минут назад»."""
    await _check_account_authorized(db, widget_name, account)

    # last snapshot
    snap_q = (
        select(MmlSnapshot.snapshot_at)
        .where(
            MmlSnapshot.widget_name == widget_name,
            MmlSnapshot.account_id == account,
        )
        .order_by(desc(MmlSnapshot.snapshot_at))
        .limit(1)
    )
    last_snap = (await db.execute(snap_q)).scalar_one_or_none()

    # sync state
    state_q = select(MmlSyncState).where(
        MmlSyncState.widget_name == widget_name,
        MmlSyncState.account_id == account,
    )
    state = (await db.execute(state_q)).scalars().first()

    return StatusOut(
        has_snapshot=last_snap is not None,
        last_snapshot_at=last_snap,
        last_sync_at=state.last_sync_at if state else None,
        last_sync_status=state.last_sync_status if state else None,
        last_error=state.last_error if state else None,
        next_sync_after=state.next_sync_after if state else None,
        sync_count=state.sync_count if state else 0,
    )


@router.post("/{widget_name}/snapshot", status_code=201)
async def upsert_snapshot(
    widget_name: str,
    body: SnapshotIn,
    account: str = Query(...),
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
    db: AsyncSession = Depends(get_db),
):
    """
    Записать/обновить снапшот. Сейчас защищён ADMIN_SECRET — этим путём
    воркер или сам виджет может класть свой результат. В Phase 3 переедем
    на per-tenant JWT.

    Upsert по ключу (widget, account, store, period_from, period_to) —
    повторная синхронизация того же периода ничего не дублирует.
    """
    _check_admin(x_admin_secret)
    await _check_account_authorized(db, widget_name, account)

    stmt = insert(MmlSnapshot).values(
        widget_name=widget_name,
        account_id=account,
        store_id=body.store_id,
        period_from=body.period_from,
        period_to=body.period_to,
        inventory=body.inventory,
        abc=body.abc,
        xyz=body.xyz,
        rfm=body.rfm,
        debtors=body.debtors,
        meta=body.meta,
        products_count=body.products_count,
        demands_count=body.demands_count,
        compute_time_ms=body.compute_time_ms,
    )
    # ON CONFLICT — обновляем JSONB и счётчики, snapshot_at сдвигаем на now()
    stmt = stmt.on_conflict_do_update(
        constraint="uq_mml_snapshots_key",
        set_={
            "snapshot_at": datetime.utcnow(),
            "inventory": body.inventory,
            "abc": body.abc,
            "xyz": body.xyz,
            "rfm": body.rfm,
            "debtors": body.debtors,
            "meta": body.meta,
            "products_count": body.products_count,
            "demands_count": body.demands_count,
            "compute_time_ms": body.compute_time_ms,
        },
    )
    await db.execute(stmt)
    await db.commit()
    return {"ok": True}


@router.delete("/{widget_name}/snapshot", status_code=204)
async def clear_snapshots(
    widget_name: str,
    account: str = Query(...),
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
    db: AsyncSession = Depends(get_db),
):
    """Стереть все снапшоты тенанта. На случай ручного reset'а."""
    _check_admin(x_admin_secret)
    from sqlalchemy import delete as sql_delete

    await db.execute(
        sql_delete(MmlSnapshot).where(
            MmlSnapshot.widget_name == widget_name,
            MmlSnapshot.account_id == account,
        )
    )
    await db.commit()
