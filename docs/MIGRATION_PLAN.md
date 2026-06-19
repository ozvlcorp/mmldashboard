# План миграции: MML + widget-backend → `oy-dashboard-ai`

> Документ для **следующей Claude Code сессии**, которая будет работать в
> новом репозитории `ozvlcorp/oy-dashboard-ai`. План написан в текущем
> репо `ozvlcorp/mmldashboard`, потому что та сессия его подхватит как
> исходное ТЗ.

---

## 1. Контекст и цель

### Что есть сейчас
Три отдельных репозитория, три отдельных деплоя, три разных архитектуры:

| Репозиторий | Что делает | Стек | Где деплой | БД |
|---|---|---|---|---|
| `ozvlcorp/mmldashboard` | Виджет аналитики (ABC/XYZ/RFM/Должники/AI) — основной продукт | Next.js 16 + TS | Netlify (превью) + Dokploy (план) | нет, всё в браузере |
| `ozvlcorp/widget-backend` | Единый бекенд для виджетов МойСклад: Vendor API (активация/деактивация), хранение токенов | FastAPI + SQLAlchemy + asyncpg | Dokploy (`widget-backend.oymoysklad.com`) | **Postgres с живыми токенами клиентов** |
| `ozvlcorp/dashboard-widget` | Старый/первый дашборд («Moysklad Dashboard») | Next.js | Dokploy (`dashboard.oymoysklad.com`) | нет |

### Что хотим получить
**Один монорепо** `ozvlcorp/oy-dashboard-ai` с тремя сервисами в одном
`docker-compose.yml`, который разворачивается в Dokploy одним кликом:

```
┌─ Dokploy: проект «oy-dashboard-ai» ─────────────────────────┐
│                                                              │
│  backend (FastAPI)  ←  Vendor API + token store              │
│                       + новые snapshot endpoints             │
│                                                              │
│  worker (Python)    ←  cron каждые 30 минут:                 │
│                       тянет дельты МойСклад,                 │
│                       считает аналитику,                     │
│                       пишет snapshots в Postgres             │
│                                                              │
│  widget (Next.js)   ←  читает snapshots из backend           │
│                       за ~300мс, токен МойСклад              │
│                       не покидает сервер                     │
│                                                              │
│  postgres           ←  общая БД, тома сохраняются            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Главные выгоды
1. **Скорость**: первая загрузка виджета 300мс вместо 10-30 секунд (читаем
   готовый snapshot, а не вычисляем заново).
2. **Безопасность**: токены МойСклад больше не попадают в браузер
   (сейчас лежат в sessionStorage).
3. **Масштабируемость**: не упрёмся в лимит МойСклад 5rps/токен — наш
   worker один раз в 30 минут синхронизирует, виджет читает из нашей БД.
4. **История**: накапливаем snapshots → можем показывать тренды («рост
   MML за месяц», сравнение периодов) без повторных вычислений.
5. **Биллинг и подписка**: вся коммуникация через наш backend → можем
   считать использование, ограничивать по подписке, логировать.

---

## 2. Конфиденциальная инфраструктура

⚠️ **Postgres в widget-backend содержит ЖИВЫЕ токены клиентов**
(подтверждено пользователем). Это значит:

- Таблицы `widget_configs` и `app_tokens` **НЕЛЬЗЯ** ронять, переименовывать
  или менять их колонки без миграции с сохранением данных.
- Все миграции делаем через **Alembic** только в режиме `add column` /
  `create table`. Никакого `drop`/`alter type` без явного обсуждения.
- Перед первым деплоем новой схемы — снимок (backup) Postgres в Dokploy
  (Backups → On-Demand Backup).
- При переключении домена `widget-backend.oymoysklad.com` со старого
  сервиса на новый — старый держим в Dokploy ещё неделю как fallback.

---

## 3. Целевая структура репозитория

```
ozvlcorp/oy-dashboard-ai/
│
├── README.md                       ← обзор + как запускать локально
├── docker-compose.yml              ← entry point для Dokploy
├── docker-compose.dev.yml          ← локальный dev override
├── .env.example                    ← список всех ENV переменных
├── .gitignore
│
├── backend/                        ← Python FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   │       ├── 001_existing_schema.py   ← фиксирует текущую схему
│   │       │                             widget-backend (widget_configs,
│   │       │                             app_tokens)
│   │       └── 002_add_snapshots.py     ← NEW: mml_snapshots, sync_state
│   ├── app/
│   │   ├── main.py                      ← из widget-backend как есть
│   │   ├── config.py                    ← Pydantic Settings
│   │   ├── db.py                        ← async engine
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── widget_config.py         ← существующая
│   │   │   ├── app_token.py             ← существующая
│   │   │   ├── snapshot.py              ← NEW
│   │   │   └── sync_state.py            ← NEW
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── vendor.py                ← существующая (Vendor API)
│   │   │   ├── token.py                 ← существующая
│   │   │   ├── admin.py                 ← существующая
│   │   │   ├── snapshot.py              ← NEW (GET /mml/snapshot)
│   │   │   └── refresh.py               ← NEW (POST /mml/refresh)
│   │   │
│   │   ├── analytics/                   ← NEW — порт формул из widget
│   │   │   ├── __init__.py
│   │   │   ├── inventory.py             ← порт lib/analytics/inventory.ts
│   │   │   ├── abc.py
│   │   │   ├── xyz.py
│   │   │   └── rfm.py
│   │   │
│   │   ├── moysklad/                    ← NEW — server-side клиент
│   │   │   ├── __init__.py
│   │   │   ├── client.py                ← httpx async
│   │   │   ├── transform.py             ← порт lib/moysklad/transform.ts
│   │   │   └── types.py
│   │   │
│   │   └── worker/                      ← NEW — фоновая синхронизация
│   │       ├── __init__.py
│   │       ├── scheduler.py             ← APScheduler / cron loop
│   │       ├── sync.py                  ← основная логика sync(tenant)
│   │       └── ratelimit.py             ← respect 5rps per token
│   │
│   └── tests/                           ← pytest
│       ├── conftest.py
│       ├── test_analytics_parity.py     ← КРИТИЧНО — формулы должны
│       │                                  совпадать с TS на 100%
│       └── test_sync.py
│
├── widget/                              ← Next.js (бывший mmldashboard)
│   ├── Dockerfile                       ← из текущего mmldashboard
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── app/                             ← без изменений
│   ├── components/                      ← без изменений
│   ├── lib/
│   │   ├── analytics/                   ← оставить — но используется
│   │   │                                  только как референс/fallback
│   │   ├── moysklad/                    ← УДАЛИТЬ после Phase 4
│   │   │                                  (browser.ts больше не нужен)
│   │   ├── api/                         ← NEW — клиент к нашему backend
│   │   │   ├── snapshot.ts              ← GET /mml/snapshot
│   │   │   ├── refresh.ts               ← POST /mml/refresh
│   │   │   └── client.ts                ← fetch wrapper + JWT
│   │   └── ...
│   └── public/
│
├── packages/                            ← (опционально, Phase 2+)
│   └── shared-types/                    ← TS-типы snapshot, общие
│                                          между widget и backend
│
└── .github/
    └── workflows/
        ├── backend-test.yml
        ├── widget-build.yml
        └── deploy-dokploy.yml           ← webhook на Dokploy
```

---

## 4. Новая схема Postgres (миграция 002)

**Все новые таблицы — additive.** Существующие не трогаем.

```sql
-- 002_add_snapshots.py (Alembic upgrade)

CREATE TABLE mml_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    widget_name     TEXT NOT NULL,
    account_id      TEXT NOT NULL,         -- MoySklad accountId
    snapshot_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    period_from     DATE NOT NULL,
    period_to       DATE NOT NULL,
    store_id        TEXT,                  -- nullable, NULL = все склады

    -- сами данные хранятся как JSONB; структура совпадает с тем что
    -- сейчас отдаёт loadAnalytics в lib/moysklad/browser.ts
    inventory       JSONB NOT NULL,        -- InventoryInput[]
    abc             JSONB NOT NULL,
    xyz             JSONB NOT NULL,
    rfm             JSONB NOT NULL,
    debtors         JSONB,                 -- nullable, есть в RFM-сессии
    meta            JSONB NOT NULL,        -- {periodDays, productsCount, ...}

    -- метрики для биллинга
    products_count  INTEGER NOT NULL,
    demands_count   INTEGER NOT NULL,
    compute_time_ms INTEGER,

    -- индекс на быстрый поиск последнего snapshot
    UNIQUE (widget_name, account_id, store_id, period_from, period_to)
);

CREATE INDEX idx_snapshots_recent
  ON mml_snapshots (widget_name, account_id, snapshot_at DESC);

CREATE TABLE mml_sync_state (
    widget_name      TEXT NOT NULL,
    account_id       TEXT NOT NULL,
    last_sync_at     TIMESTAMPTZ,
    last_sync_status TEXT,                 -- ok | error | running
    last_error       TEXT,
    next_sync_after  TIMESTAMPTZ,
    sync_count       INTEGER DEFAULT 0,
    PRIMARY KEY (widget_name, account_id)
);
```

**Важно:** `mml_snapshots` хранит **полный snapshot целиком**, а не
нормализованно. Это даёт:
- читать всё одним SELECT,
- легко добавлять новые поля (просто кладём в JSONB),
- естественно версионируется (по snapshot_at).

Минус — больше места на диске, но при ~1000 SKU на клиента это
~200КБ/snapshot, при 100 клиентах × 48 snapshots/день = 1ГБ/день,
управляемо.

**TTL/retention:** хранить только последние 60 snapshots на (widget,
account, store) + один на каждый день за последние 90 дней (для
трендов). Cleanup в worker раз в сутки.

---

## 5. API контракт нового backend

### Существующие (сохраняем как есть)

- `PUT /{widget}/api/moysklad/vendor/1.0/apps/...` — Vendor API,
  активация виджета
- `DELETE /{widget}/api/moysklad/vendor/1.0/apps/...` — деактивация
- `GET /{widget}/token?account=...` — отдаёт access_token для виджета
- `POST /admin/widgets` — регистрация нового виджета (X-Admin-Secret)

### Новые для MML

```
GET /mml/snapshot?account={id}&store={id?}
  → 200 { snapshot_at, period: {from, to}, inventory, abc, xyz, rfm, meta }
  → 404 если ещё нет ни одного snapshot (показать «идёт первичная синхронизация»)
  → 401 если виджет не активирован для этого account

GET /mml/snapshot/status?account={id}
  → 200 { last_sync_at, last_sync_status, next_sync_after, is_syncing }

POST /mml/refresh?account={id}
  → 202 { task_id, eta_seconds }
  → 429 если уже идёт sync или слишком частые запросы
       (rate limit: 1 refresh / 5 минут на (widget, account))

GET /mml/history?account={id}&metric=turnover&days=30
  → 200 { points: [{date, value}, ...] }    -- для трендов

POST /mml/period?account={id}&from=...&to=...
  → 202 { task_id }     -- сменить период → пересчитать snapshot
                           под новый диапазон дат
```

**Аутентификация виджета:**
- При первом открытии в МойСклад: виджет приходит с `contextKey` (JWT
  от МойСклад). Backend валидирует через JWKS МойСклад, извлекает
  `accountId`, возвращает наш собственный session JWT.
- Все последующие запросы — с нашим JWT в `Authorization: Bearer`.
- Токен МойСклад **никогда не уходит в браузер** — только сервер
  использует его при синхронизации.

---

## 6. Worker — синхронизация в фоне

### Алгоритм одного цикла

```python
# app/worker/sync.py
async def sync_tenant(widget: str, account: str):
    state = await get_sync_state(widget, account)
    state.last_sync_status = 'running'
    await save(state)

    try:
        token = await get_token(widget, account)
        if not token:
            raise ValueError("no token for this account")

        # Дефолтный период — последние 30 дней. Можно переопределить
        # через user preferences (см. таблицу mml_preferences позже).
        until = datetime.utcnow()
        from_ = until - timedelta(days=30)

        async with rate_limited_client(token, max_rps=4) as ms:
            assortment = await ms.fetch_all('/entity/assortment',
                                            params={'stockStore.byStore': 'true'})
            demands = await ms.fetch_all('/entity/demand',
                                          params={'filter': f'moment>={from_};moment<={until}',
                                                  'expand': 'positions.assortment,agent,rate.currency'})
            retail = await ms.fetch_all('/entity/retaildemand', ...) # с catch
            profit = await ms.fetch_all('/report/profit/byproduct', ...)
            segments = await load_customer_segments(ms, demands)
            currencies = await load_currencies(ms)
            stores = await load_stores(ms)

        # Вычисления — порт формул из lib/analytics/*.ts
        inventory = build_inventory(assortment, demands, profit, currencies)
        abc = build_abc(demands)
        xyz = build_xyz(demands, bucket_days=7, periods_count=8)
        rfm = build_rfm(demands, segments, currencies)

        await save_snapshot(widget, account, {
            'inventory': inventory, 'abc': abc, 'xyz': xyz, 'rfm': rfm,
            'meta': {...}
        })

        state.last_sync_at = datetime.utcnow()
        state.last_sync_status = 'ok'
        state.sync_count += 1
    except Exception as e:
        state.last_sync_status = 'error'
        state.last_error = str(e)[:500]
        logger.exception("sync failed for %s/%s", widget, account)
    finally:
        state.next_sync_after = datetime.utcnow() + timedelta(minutes=30)
        await save(state)
```

### Scheduler

- **APScheduler** или простой `asyncio` loop в отдельном Docker-контейнере
- Каждые 30 минут: `SELECT widget_name, account_id FROM app_tokens
  WHERE active = true` и для каждого — `sync_tenant()`.
- Параллелизм: до 5 синхронизаций одновременно (`asyncio.Semaphore(5)`).
- Если есть `mml_sync_state.next_sync_after > now()` — пропускаем
  (чтобы недавний refresh не дублировался).

### Резервный путь (Phase 1, до worker'а)

Пока worker не написан, новый backend может работать в "lazy mode":
- `GET /mml/snapshot` если нет snapshot или старше 30 минут → выполняет
  sync_tenant() **синхронно** и возвращает свежие данные.
- Это медленно (10-30с на первый запрос), но соответствует текущему
  поведению виджета.
- После того как worker заработает — `GET /mml/snapshot` всегда быстрый.

---

## 7. Порт формул TypeScript → Python

### Что переносим

Эти файлы из `widget/lib/analytics/` нужно **точно** воспроизвести в
`backend/app/analytics/`:

| TypeScript | Python | Что считает |
|---|---|---|
| `inventory.ts` | `inventory.py` | Складская: stockDays, dailyGross, oosLoss, frozenMoney, MML flag |
| `abc.ts` | `abc.py` | ABC классы по cumShare с порогами 0.8/0.95 |
| `xyz.ts` | `xyz.py` | XYZ по коэффициенту вариации, бакеты 7 дней × 8 периодов |
| `rfm.ts` | `rfm.py` | Recency/Frequency/Monetary, мультивалютная M |

И из `widget/lib/moysklad/`:

| TypeScript | Python | Что делает |
|---|---|---|
| `transform.ts` | `moysklad/transform.py` | assortment → inventoryInput, demand → abcInput, и т.д. |
| `browser.ts` (частично) | `moysklad/client.py` | fetchAllParallel, концепция rate limit |

### КРИТИЧНО: parity tests

Перед мерджем PR с портом формул — **обязательно** написать
`backend/tests/test_analytics_parity.py`:

```python
# Идея: загрузить фикстуру (snapshot из текущего widget),
# прогнать через Python-формулы, проверить что результат
# побитово совпадает с тем что вернул бы TS

def test_inventory_parity():
    fixture = load_json('fixtures/sample_account.json')  # снимок реальных данных
    py_result = build_inventory(fixture.assortment, fixture.demands, ...)
    ts_reference = load_json('fixtures/expected_inventory.json')  # генерим из widget
    assert deep_equal(py_result, ts_reference, tolerance=0.01)
```

Фикстуру `expected_inventory.json` сгенерировать **один раз** из текущего
работающего виджета — добавить временный кнопку «Скачать снапшот» которая
дёргает `buildInventoryReport` и сохраняет JSON.

---

## 8. Widget — переключение на backend

### Что меняется в `widget/`

**Шаг 1: добавить `lib/api/snapshot.ts`**
```ts
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function fetchSnapshot(account: string, store?: string) {
  const r = await fetch(
    `${BACKEND}/mml/snapshot?account=${account}` + (store ? `&store=${store}` : ''),
    { headers: { Authorization: `Bearer ${getSessionJwt()}` } }
  );
  if (r.status === 404) return null;  // ещё не синхронизировано
  if (!r.ok) throw new Error(`backend ${r.status}`);
  return r.json();
}
```

**Шаг 2: в `home-client.tsx` заменить `loadAnalytics(token, params)`**
на `fetchSnapshot(account)`:
```ts
// БЫЛО:
const result = await loadAnalytics(token, params, setProgress);

// СТАЛО:
const result = await fetchSnapshot(account, params.storeId);
if (!result) {
  // показать «идёт первичная синхронизация», запустить /mml/refresh,
  // поллить /mml/snapshot/status каждые 3 секунды
  await waitForFirstSync(account);
  result = await fetchSnapshot(account);
}
```

**Шаг 3: убрать вызовы МойСклад из браузера**
- `lib/moysklad/browser.ts` → удалить (или оставить с deprecated-маркером
  на 1 релиз для fallback).
- `app/api/moysklad/page/route.ts` → удалить (это прокси к МойСклад,
  больше не нужен).
- sessionStorage `oy-ms-token`, `oy-ms-params` → удалить.

**Шаг 4: обновить UI**
- Бейдж «обновлено X минут назад» уже есть в `home-client.tsx`
  (`cacheTime`/`formatRelativeTime`) — переподключить к `last_sync_at`
  из backend.
- Кнопка «Обновить» вместо `manualRefresh` (который сейчас зовёт
  `loadAnalytics`) → дёргать `POST /mml/refresh` + поллить статус.

---

## 9. docker-compose.yml для Dokploy

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-oysuite}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # порт НЕ пробрасываем наружу — доступ только из docker network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-oysuite}
      ADMIN_SECRET: ${ADMIN_SECRET}
      JWT_SIGNING_KEY: ${JWT_SIGNING_KEY}
      MS_VENDOR_APP_UID: ${MS_VENDOR_APP_UID}
      MS_VENDOR_SECRET: ${MS_VENDOR_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
    # Dokploy сам прокинет порт 8000 на внешний домен api.oymoysklad.com

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    command: python -m app.worker.scheduler
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-oysuite}
    depends_on:
      - postgres

  widget:
    build:
      context: ./widget
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_BACKEND_URL: ${BACKEND_PUBLIC_URL}
      NODE_ENV: production
      PORT: 3000
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Переменные окружения в Dokploy

| Variable | Источник | Пример |
|---|---|---|
| `POSTGRES_USER` | сгенерить | `oysuite` |
| `POSTGRES_PASSWORD` | сгенерить, в Vault | 32 случайных символа |
| `POSTGRES_DB` | сгенерить | `oysuite` |
| `ADMIN_SECRET` | сгенерить | 32 случайных символа |
| `JWT_SIGNING_KEY` | сгенерить | `openssl rand -hex 32` |
| `MS_VENDOR_APP_UID` | из МойСклад Vendor Cabinet | `oy.mml` |
| `MS_VENDOR_SECRET` | из МойСклад Vendor Cabinet | секрет приложения |
| `ANTHROPIC_API_KEY` | существующий | `sk-ant-...` |
| `BACKEND_PUBLIC_URL` | домен | `https://api.oymoysklad.com` |

---

## 10. Фазы миграции (без потери данных, без даунтайма)

### Фаза 0 — Скелет (1 день)
- [ ] Создать пустой репо `ozvlcorp/oy-dashboard-ai`
- [ ] Скопировать структуру папок из секции 3
- [ ] Положить `docker-compose.yml`, `.env.example`, `README.md`
- [ ] Скопировать `mmldashboard/*` → `widget/` (1:1, ничего не меняя)
- [ ] Скопировать `widget-backend/*` → `backend/` (1:1)
- [ ] Проверить локально: `docker compose up` поднимается, виджет
      открывается на localhost:3000, backend на localhost:8000

### Фаза 1 — Параллельный backend (2 дня)
- [ ] В Dokploy создать **новый** сервис `oy-suite-backend` из нового
      репо, указать `DATABASE_URL` на **ту же** Postgres что и старый
      `widget-backend` (Dokploy → Database → Connection String)
- [ ] Запустить — он должен поднять Alembic 001 (фиксация существующей
      схемы, без изменений)
- [ ] Прогнать `curl widget-backend.oymoysklad.com/healthz` и
      `curl <новый-домен>/healthz` — оба должны отвечать одинаково
- [ ] Сравнить ответы на `GET /{widget}/token?account=...` — должны
      быть идентичны
- [ ] Старый widget-backend оставляем работать, новый — параллельно

### Фаза 2 — Новые таблицы и worker (2 дня)
- [ ] **Backup Postgres** в Dokploy перед миграцией
- [ ] Применить Alembic 002 (создание `mml_snapshots`, `mml_sync_state`)
- [ ] Запустить worker в Dokploy (отдельный сервис), он начнёт
      синхронизировать аккаунты из `app_tokens` где `widget_name='mml'`
- [ ] Через час проверить таблицу `mml_snapshots` — должны появиться
      первые записи

### Фаза 3 — Переключение виджета (3 дня)
- [ ] В `widget/` добавить `lib/api/snapshot.ts` и переключить
      `home-client.tsx` на новый источник данных
- [ ] Деплой нового виджета на новый домен (например
      `mml.oymoysklad.com`), старый Netlify-превью пока живёт
- [ ] Тестируем на личных аккаунтах: подключение токена, открытие виджета,
      все 6 разделов, смена периода, смена склада, должники, AI
- [ ] DNS-switch: основной домен виджета → новый деплой
- [ ] Через неделю мониторинга — старый Netlify-деплой выключаем

### Фаза 4 — Старый widget-backend (1 день)
- [ ] Переключить DNS `widget-backend.oymoysklad.com` на новый сервис
- [ ] Старый `widget-backend` Dokploy остановить (НЕ удалять ещё неделю)
- [ ] Через неделю — удалить старый сервис
- [ ] Старые репозитории `widget-backend` и `mmldashboard` пометить
      DEPRECATED в README, не удалять (история)

### Фаза 5 — `dashboard-widget` (по решению владельца)
- [ ] Изучить что уникального в `dashboard-widget` — есть ли там фичи,
      которых нет в MML
- [ ] Если есть — портировать как дополнительные табы в `widget/`
- [ ] Если нет — `dashboard.oymoysklad.com` → редирект на новый MML
- [ ] Репо `dashboard-widget` пометить DEPRECATED

---

## 11. Что нужно сделать руками вне кода

### От владельца (Jamshid)
- [x] Создать пустой репо `ozvlcorp/oy-dashboard-ai` (сделано)
- [ ] Добавить новый репо в scope Claude GitHub App (см. инструкцию
      от Claude-in-Chrome)
- [ ] Создать новую Claude Code сессию с этим репо как primary
- [ ] В МойСклад Vendor Cabinet:
    - Зарегистрировать приложение `oy.mml` (если не уже)
    - Указать URL обработчика: `https://api.oymoysklad.com/mml/api/moysklad/vendor/1.0/...`
    - Получить App UID и Secret → положить в Dokploy env
- [ ] Купить домены если ещё нет:
    - `api.oymoysklad.com` — для backend
    - `mml.oymoysklad.com` — для виджета (или оставить `mml.oymoysklad.com`
      на новом)

### От следующей сессии Claude
- [ ] Прочитать этот файл (`docs/MIGRATION_PLAN.md` в репо
      `ozvlcorp/mmldashboard`)
- [ ] Прочитать код в `ozvlcorp/widget-backend` (доступ открыт)
- [ ] Прочитать код в `ozvlcorp/mmldashboard` (этот репо)
- [ ] Опционально — прочитать `ozvlcorp/dashboard-widget` для Phase 5
- [ ] Начать с Фазы 0, открывать PR по каждой фазе
- [ ] После каждой фазы — пользователь подтверждает прежде чем
      идти дальше

---

## 12. Открытые вопросы (нужны решения от владельца)

1. **Имя backend-домена**: `api.oymoysklad.com` или оставить
   `widget-backend.oymoysklad.com`?
2. **Имя widget-домена**: `mml.oymoysklad.com`? `widget.oymoysklad.com`?
   Что прописывать в МойСклад Vendor Cabinet как iframe URL?
3. **Частота синхронизации**: 30 минут (предложение) подходит? Или
   быстрее (15 мин — больше нагрузка) / реже (60 мин — данные более
   устаревшие)?
4. **Размер истории**: хранить 60 snapshots на (widget,account,store) +
   1/день за 90 дней — норм? Или больше/меньше?
5. **Биллинг — отложенно**: вводим сейчас табличку `subscription` или
   позже как отдельный PR?
6. **Тарифы**: бесплатный/Pro/Enterprise? Лимиты по аккаунтам, по
   частоте refresh, по AI-запросам?
7. **AI-консультант**: ANTHROPIC_API_KEY сейчас прокидывается прямо
   через backend; ставим лимит токенов на (widget,account) — сколько?

---

## 13. Чего НЕ делать

- ❌ Не использовать `xlsx` пакет в backend — он у нас был проблемный
  из-за блокировки CDN. Если нужен экспорт — делать на стороне widget.
- ❌ Не мерджить ничего без `pytest backend/tests/test_analytics_parity.py`
  на зелёном (формулы должны совпадать с TS).
- ❌ Не пытаться сделать сложную JWT-сессию между виджетом и backend
  в первой версии. Сначала простой Bearer-token, выпускаемый при первой
  Vendor Cabinet auth.
- ❌ Не дублировать формулы между TS и Python надолго. После Phase 3 —
  единственный источник правды это Python в backend. TS-формулы в
  `widget/lib/analytics/` помечаем `@deprecated` и удаляем в Phase 4.

---

## 14. Контакты и ресурсы

- Документация МойСклад JSON API 1.2: https://dev.moysklad.ru/doc/api/remap/1.2/
- Документация Vendor API: https://dev.moysklad.ru/doc/api/vendor/1.0/
- Dokploy: https://dokploy.oymoysklad.com (доступ у владельца)
- Текущий MML-виджет (Netlify preview): https://deploy-preview-1--mllldashboard.netlify.app
- Текущий backend: https://widget-backend.oymoysklad.com

**Связаться с предыдущей сессией:** этот PR-документ и история коммитов
в `ozvlcorp/mmldashboard` — ветка `claude/open-project-jS8Vo`. Последняя
работа: добавлен новый календарь, sticky-thead, конфигурируемый горизонт.
