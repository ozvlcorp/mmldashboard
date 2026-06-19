from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from .database import Base


class WidgetConfig(Base):
    """Per-widget configuration — one row per widget app registered on this backend."""
    __tablename__ = "widget_configs"

    widget_name = Column(String, primary_key=True)
    app_secret  = Column(String, nullable=False)   # MoySklad app secret for Vendor API calls
    app_uid     = Column(String, nullable=True)    # MoySklad appUid (optional, for reference)
    created_at  = Column(DateTime, server_default=func.now())
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())


class AppToken(Base):
    """Stores MoySklad access tokens per widget + account."""
    __tablename__ = "app_tokens"

    widget_name = Column(String, primary_key=True)
    account_name = Column(String, primary_key=True)
    app_uid = Column(String, nullable=False)
    access_token = Column(String, nullable=False)
    account_id = Column(String, nullable=True, index=True)  # MoySklad account UUID
    installed_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ContextSession(Base):
    """
    Short-lived mapping: contextKey → (widget_name, account_name).
    MoySklad generates a contextKey and passes it to the iframe URL.
    The frontend sends it here to get the access_token for its session.
    """
    __tablename__ = "context_sessions"

    context_key = Column(String, primary_key=True)
    widget_name = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


# ─────────────────────────────────────────────────────────────────────────
# Phase 2: cached analytics snapshots
# ─────────────────────────────────────────────────────────────────────────
#
# Идея: вместо того чтобы виджет каждый раз перезагружал данные напрямую
# из МойСклад (10-30 секунд), worker раз в 30 минут вычисляет полный
# AnalyticsResult и кладёт сюда. Виджет читает готовое за ~200мс.
#
# Все таблицы — additive: существующие widget_configs/app_tokens/
# context_sessions не трогаем. SQLAlchemy create_all() в init_db()
# создаст эти таблицы на старте контейнера, если их ещё нет.
# Foreign keys на app_tokens НЕ ставим — там PK по account_name, а нам
# нужно по account_id (это не одно и то же); связь поддерживаем
# логически в коде, не на уровне БД.


class MmlSnapshot(Base):
    """
    Готовый ответ /mml/snapshot для конкретного (widget, account, store,
    период). Версионирован: на каждую синхронизацию пишется новая строка
    (UNIQUE по ключу + период → если воркер прогоняет повторно тот же
    период, делаем upsert). Старые подчищает периодический cleanup
    в worker'е (Phase 2b).
    """
    __tablename__ = "mml_snapshots"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    widget_name = Column(String, nullable=False)
    account_id = Column(String, nullable=False)
    store_id = Column(String, nullable=True)           # NULL = все склады
    period_from = Column(DateTime, nullable=False)
    period_to = Column(DateTime, nullable=False)
    snapshot_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Полный набор данных, готовый к отдаче клиенту. Структура зеркалит
    # AnalyticsResult из widget/lib/moysklad/browser.ts.
    inventory = Column(JSONB, nullable=False)
    abc = Column(JSONB, nullable=False)
    xyz = Column(JSONB, nullable=False)
    rfm = Column(JSONB, nullable=False)
    debtors = Column(JSONB, nullable=True)             # отдельная синхронизация
    meta = Column(JSONB, nullable=False)

    # Денормализованные метрики — для дешёвых выборок без распаковки JSONB
    # и для биллинга (сколько данных обработали клиенту).
    products_count = Column(Integer, nullable=False)
    demands_count = Column(Integer, nullable=False)
    compute_time_ms = Column(Integer, nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "widget_name", "account_id", "store_id", "period_from", "period_to",
            name="uq_mml_snapshots_key",
        ),
        # Быстрое «последний снимок для (widget, account)»
        Index("ix_mml_snapshots_recent", "widget_name", "account_id", "snapshot_at"),
    )


class MmlSyncState(Base):
    """
    Состояние последней синхронизации для (widget, account). Worker
    использует, чтобы:
    - не дублировать одновременные синки (last_sync_status == 'running'),
    - откладывать retry после ошибки (next_sync_after),
    - показывать пользователю «обновлено X минут назад» (last_sync_at).
    """
    __tablename__ = "mml_sync_state"

    widget_name = Column(String, primary_key=True)
    account_id = Column(String, primary_key=True)
    last_sync_at = Column(DateTime, nullable=True)
    last_sync_status = Column(String, nullable=True)   # ok | error | running
    last_error = Column(String, nullable=True)
    next_sync_after = Column(DateTime, nullable=True)
    sync_count = Column(Integer, nullable=False, server_default="0")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
