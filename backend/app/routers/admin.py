"""
Admin endpoints for managing widget configurations.

These are internal endpoints — protect them with a reverse-proxy rule or
set ADMIN_SECRET in your environment and pass it as the X-Admin-Secret header.

  PUT  /admin/widgets/{widget_name}   — register or update a widget's app secret
  GET  /admin/widgets                 — list all registered widgets
  GET  /admin/widgets/{widget_name}   — get a single widget config (secret masked)
  POST /admin/tokens                  — manually inject an MoySklad access token
                                        (for testing without the Vendor API flow)
  GET  /admin/tokens                  — list (masked) tokens
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from pydantic import BaseModel
from typing import Optional

from ..config import settings
from ..database import get_db
from ..models import AppToken, WidgetConfig

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


def _check_secret(x_admin_secret: Optional[str] = Header(default=None)):
    if settings.admin_secret and x_admin_secret != settings.admin_secret:
        raise HTTPException(403, "Forbidden")


class WidgetConfigRequest(BaseModel):
    app_secret: str
    app_uid: Optional[str] = None


class WidgetConfigResponse(BaseModel):
    widget_name: str
    app_uid: Optional[str]
    app_secret_set: bool


@router.put("/widgets/{widget_name}", dependencies=[Depends(_check_secret)])
async def upsert_widget_config(
    widget_name: str,
    body: WidgetConfigRequest,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.get(WidgetConfig, widget_name)
    if existing:
        existing.app_secret = body.app_secret
        if body.app_uid is not None:
            existing.app_uid = body.app_uid
    else:
        db.add(WidgetConfig(
            widget_name=widget_name,
            app_secret=body.app_secret,
            app_uid=body.app_uid,
        ))
    await db.commit()
    logger.info("Widget config upserted for '%s'", widget_name)
    return {"status": "ok", "widget_name": widget_name}


@router.get("/widgets", dependencies=[Depends(_check_secret)])
async def list_widget_configs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WidgetConfig))
    rows = result.scalars().all()
    return [
        WidgetConfigResponse(
            widget_name=r.widget_name,
            app_uid=r.app_uid,
            app_secret_set=bool(r.app_secret),
        )
        for r in rows
    ]


@router.get("/widgets/{widget_name}", dependencies=[Depends(_check_secret)])
async def get_widget_config(widget_name: str, db: AsyncSession = Depends(get_db)):
    cfg = await db.get(WidgetConfig, widget_name)
    if not cfg:
        raise HTTPException(404, f"Widget '{widget_name}' not configured")
    return WidgetConfigResponse(
        widget_name=cfg.widget_name,
        app_uid=cfg.app_uid,
        app_secret_set=bool(cfg.app_secret),
    )


# ── Manual token management ──────────────────────────────────────────────
#
# В production токены попадают сюда через Vendor API: МойСклад дёргает
# PUT /{widget}/api/moysklad/vendor/1.0/apps/... когда клиент устанавливает
# виджет. Эти admin-эндпоинты — для тестирования без живой связки с
# МойСклад: можно вставить токен руками и сразу прогнать /sync.

class AppTokenRequest(BaseModel):
    widget_name: str
    account_id: str         # MoySklad accountId (UUID)
    access_token: str       # МойСклад access token (Bearer)
    app_uid: Optional[str] = None    # default to "manual" if unset
    account_name: Optional[str] = None  # default to account_id


class AppTokenListItem(BaseModel):
    widget_name: str
    account_name: str
    account_id: Optional[str]
    app_uid: str
    access_token_masked: str   # only last 6 chars


@router.post("/tokens", dependencies=[Depends(_check_secret)])
async def upsert_app_token(body: AppTokenRequest, db: AsyncSession = Depends(get_db)):
    """Ручная вставка токена МойСклад. Upsert по (widget_name, account_name)."""
    name = body.account_name or body.account_id
    stmt = pg_insert(AppToken).values(
        widget_name=body.widget_name,
        account_name=name,
        app_uid=body.app_uid or "manual",
        access_token=body.access_token,
        account_id=body.account_id,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["widget_name", "account_name"],
        set_={
            "access_token": body.access_token,
            "account_id": body.account_id,
            "app_uid": body.app_uid or "manual",
        },
    )
    await db.execute(stmt)
    await db.commit()
    logger.info("App token upserted for %s/%s (account_id=%s)",
                body.widget_name, name, body.account_id)
    return {"status": "ok"}


@router.get("/tokens", dependencies=[Depends(_check_secret)])
async def list_app_tokens(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(AppToken))).scalars().all()
    return [
        AppTokenListItem(
            widget_name=r.widget_name,
            account_name=r.account_name,
            account_id=r.account_id,
            app_uid=r.app_uid,
            access_token_masked="…" + (r.access_token[-6:] if r.access_token else ""),
        )
        for r in rows
    ]
