"""
Фоновый scheduler — автоматический sync всех (widget, account) каждые 30 минут.

Запускается отдельным Docker-контейнером (см. docker-compose.yml service
`worker`), команда: `python -m app.worker.scheduler`.

Идея проще чем APScheduler:
  каждые 60 секунд проверяем mml_sync_state, для тех у кого
  next_sync_after <= now (или вообще нет записи) — запускаем sync_tenant.
  Concurrency cap = 5 параллельных синков чтобы не упереться в лимиты
  МойСклад и не загружать сервер.

Если sync падает — sync_tenant сам обновляет mml_sync_state со статусом
'error', next_sync_after сдвигается на +5 минут (retry с задержкой).
При успехе — next_sync_after = +30 минут.

Cleanup snapshots раз в сутки: удаляем всё что старше 90 дней.
"""
from __future__ import annotations

import asyncio
import logging
import signal
import sys
from datetime import datetime, timedelta, timezone
from typing import Iterable

from sqlalchemy import and_, delete, or_, select

from ..database import AsyncSessionLocal, init_db
from ..models import AppToken, MmlSnapshot, MmlSyncState
from .sync import sync_tenant

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("worker")

# ── settings ─────────────────────────────────────────────────────────────
TICK_SECONDS = 60                  # как часто проверяем «кому пора?»
SYNC_INTERVAL = timedelta(minutes=30)
MAX_PARALLEL_SYNCS = 5
CLEANUP_INTERVAL = timedelta(hours=24)
SNAPSHOT_RETENTION = timedelta(days=90)
HEARTBEAT_INTERVAL = timedelta(minutes=5)  # лог-биение даже если синков нет

# Семафор расшаривается между всеми тиками — даже если один sync
# затянулся на 5 минут, следующие будут ждать пока освободится слот.
_sync_semaphore = asyncio.Semaphore(MAX_PARALLEL_SYNCS)


def utcnow() -> datetime:
    """Naive UTC — для сравнения с DateTime колонками без tz в моделях."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def find_due_tenants(now: datetime) -> list[tuple[str, str]]:
    """
    Кто должен синхронизироваться прямо сейчас:
      все (widget, account) у которых либо нет mml_sync_state,
      либо next_sync_after <= now, и при этом текущий статус != 'running'.
    """
    async with AsyncSessionLocal() as db:
        # LEFT JOIN app_tokens × mml_sync_state на (widget, account_id),
        # фильтр по next_sync_after или его отсутствию.
        q = (
            select(AppToken.widget_name, AppToken.account_id, MmlSyncState.last_sync_status,
                   MmlSyncState.next_sync_after)
            .outerjoin(
                MmlSyncState,
                and_(
                    AppToken.widget_name == MmlSyncState.widget_name,
                    AppToken.account_id == MmlSyncState.account_id,
                ),
            )
            .where(AppToken.account_id.isnot(None))
        )
        rows = (await db.execute(q)).all()

    due: list[tuple[str, str]] = []
    for widget, account, status, next_after in rows:
        if status == "running":
            # уже синкается в другом воркере (или процесс падал между
            # «running» и финалом) — пропускаем, в следующем тике
            # сами разберёмся через таймаут.
            continue
        if next_after is None or next_after <= now:
            due.append((widget, account))
    return due


async def run_one(widget: str, account: str) -> None:
    """Один sync_tenant с защитой семафором — чтобы параллельно ≤ MAX_PARALLEL_SYNCS."""
    async with _sync_semaphore:
        async with AsyncSessionLocal() as db:
            try:
                result = await sync_tenant(db, widget, account)
                logger.info(
                    "sync ok: %s/%s — %d items, %d demands, %dms",
                    widget, account, result["products_count"],
                    result["demands_count"], result["took_ms"],
                )
            except Exception:
                # sync_tenant сам сохраняет error-статус в mml_sync_state;
                # здесь ловим чтобы не уронить весь scheduler.
                logger.exception("sync failed: %s/%s", widget, account)


async def cleanup_old_snapshots() -> int:
    """Удаляет snapshots старше SNAPSHOT_RETENTION. Возвращает число удалённых."""
    cutoff = utcnow() - SNAPSHOT_RETENTION
    async with AsyncSessionLocal() as db:
        # Сначала посчитаем сколько удалим — для лога
        count_q = select(MmlSnapshot.id).where(MmlSnapshot.snapshot_at < cutoff)
        ids_to_delete = [row[0] for row in (await db.execute(count_q)).all()]
        if not ids_to_delete:
            return 0
        await db.execute(delete(MmlSnapshot).where(MmlSnapshot.snapshot_at < cutoff))
        await db.commit()
        return len(ids_to_delete)


async def sync_tick() -> int:
    """Один проход: найти подходящих, запустить параллельно. Возвращает число запущенных."""
    now = utcnow()
    due = await find_due_tenants(now)
    if not due:
        return 0
    logger.info("tick: %d tenants due for sync", len(due))
    await asyncio.gather(*(run_one(w, a) for w, a in due), return_exceptions=True)
    return len(due)


async def cleanup_loop() -> None:
    """Бесконечный цикл cleanup раз в сутки."""
    while True:
        try:
            n = await cleanup_old_snapshots()
            if n:
                logger.info("cleanup: removed %d snapshots older than %s",
                            n, SNAPSHOT_RETENTION)
        except Exception:
            logger.exception("cleanup failed")
        await asyncio.sleep(CLEANUP_INTERVAL.total_seconds())


async def sync_loop() -> None:
    """
    Бесконечный цикл sync — каждые TICK_SECONDS секунд проверяем кому пора.
    Раз в HEARTBEAT_INTERVAL пишем «жив», чтобы оператор видел в логах.
    """
    last_heartbeat = utcnow()
    total_synced = 0
    while True:
        try:
            synced = await sync_tick()
            total_synced += synced
        except Exception:
            logger.exception("sync_tick failed")
        # Heartbeat: тикаем тихо, но раз в N минут говорим что живы.
        if utcnow() - last_heartbeat >= HEARTBEAT_INTERVAL:
            tokens_total = await _count_tokens()
            logger.info(
                "heartbeat: alive, %d tokens registered, %d syncs done this hour",
                tokens_total, total_synced,
            )
            last_heartbeat = utcnow()
            total_synced = 0
        await asyncio.sleep(TICK_SECONDS)


async def _count_tokens() -> int:
    async with AsyncSessionLocal() as db:
        from sqlalchemy import func
        return (await db.execute(select(func.count()).select_from(AppToken))).scalar_one()


async def main() -> None:
    logger.info(
        "scheduler starting: interval=%s, parallel=%d, tick=%ds, retention=%s",
        SYNC_INTERVAL, MAX_PARALLEL_SYNCS, TICK_SECONDS, SNAPSHOT_RETENTION,
    )
    # init_db создаёт таблицы если их нет (на случай если worker
    # стартует раньше backend)
    await init_db()

    stop = asyncio.Event()

    def _shutdown(*_):
        logger.info("shutdown signal received")
        stop.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, _shutdown)
        except NotImplementedError:
            # Windows
            pass

    tasks = [
        asyncio.create_task(sync_loop(), name="sync_loop"),
        asyncio.create_task(cleanup_loop(), name="cleanup_loop"),
    ]
    await stop.wait()
    logger.info("cancelling background tasks...")
    for t in tasks:
        t.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    logger.info("scheduler stopped")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
