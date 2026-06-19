"""
POST /{widget_name}/sync — ручной trigger sync_tenant.

В Phase 2c эту же функцию будет дёргать APScheduler автоматически
каждые 30 минут для всех (widget, account) из app_tokens. Пока — ручной
запуск через admin-секрет, чтобы можно было протестировать pipeline.
"""
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import AsyncSessionLocal, get_db
from ..worker.sync import sync_tenant

router = APIRouter(tags=["Sync"])


def _check_admin(x_admin_secret: Optional[str]) -> None:
    if not settings.admin_secret:
        return  # dev mode
    if x_admin_secret != settings.admin_secret:
        raise HTTPException(status_code=403, detail="invalid admin secret")


@router.post("/{widget_name}/sync", status_code=202)
async def trigger_sync(
    widget_name: str,
    account: str = Query(..., description="MoySklad accountId"),
    period_days: int = Query(30, ge=1, le=365),
    background: bool = Query(False, description="если true — фоном, иначе ждём результат"),
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
    bg: BackgroundTasks = None,  # FastAPI инжектирует
    db: AsyncSession = Depends(get_db),
):
    """
    Ручной запуск синхронизации для одного аккаунта.

    background=false (по умолчанию): ждём ответ, возвращаем summary с
        количеством товаров/отгрузок и временем расчёта. Удобно для
        первичной проверки.
    background=true: запускаем фоном и сразу возвращаем 202. В Phase 2c
        sched будет именно так дёргать sync — пользователь не должен
        ждать.
    """
    _check_admin(x_admin_secret)

    if background:
        # Запускаем в фоне с собственной сессией БД (зависимостью get_db
        # пользоваться нельзя — она закроется когда вернём ответ).
        async def _run():
            async with AsyncSessionLocal() as session:
                try:
                    await sync_tenant(session, widget_name, account, period_days=period_days)
                except Exception:
                    pass  # уже залогировано в sync_tenant
        bg.add_task(_run)
        return {"status": "scheduled", "widget": widget_name, "account": account}

    # Синхронный путь: ждём и возвращаем результат
    result = await sync_tenant(db, widget_name, account, period_days=period_days)
    return result
