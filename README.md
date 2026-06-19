# OY Dashboard AI

Монорепо платформы аналитических виджетов для МойСклад.

## Структура

```
oy-dashboard-ai/
├── backend/              ← FastAPI: Vendor API + хранение токенов +
│                          (Phase 2) snapshot endpoints
├── widget/               ← Next.js: MML дашборд (ABC/XYZ/RFM/Должники/AI)
├── docs/
│   └── MIGRATION_PLAN.md ← полный план: фазы, схема БД, контракты
├── docker-compose.yml    ← entry point для Dokploy
└── .env.example
```

## Текущий статус

**Фаза 0 — Скелет** ✅ (что вы сейчас видите)
- Структура папок собрана
- `backend/` = код из `ozvlcorp/widget-backend`, как есть
- `widget/` = код из `ozvlcorp/mmldashboard`, как есть
- `docker-compose.yml` поднимает Postgres + backend + widget

**Фаза 1 — Параллельный backend** ⏳ следующее
- Подключить backend к существующей Postgres widget-backend
- Запустить параллельно со старым сервисом
- Сравнить ответы — должны быть идентичны

**Фаза 2-5** — см. `docs/MIGRATION_PLAN.md`

## Локальный запуск

```bash
cp .env.example .env
# отредактируй .env (как минимум POSTGRES_PASSWORD)

docker compose up --build
```

После старта:
- **Backend** → http://localhost:8000 (Swagger: http://localhost:8000/docs)
- **Widget** → http://localhost:3000
- **Postgres** → внутри docker network как `postgres:5432`

## Разработка отдельных сервисов

### Backend (Python + FastAPI)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Локально нужна Postgres — либо через docker compose up postgres,
# либо своя
export DATABASE_URL='postgresql+asyncpg://postgres:postgres@localhost:5432/widgets'
uvicorn app.main:app --reload --port 8000
```

### Widget (Next.js)
```bash
cd widget
npm install
npm run dev   # http://localhost:3000
```

## Деплой в Dokploy

1. В Dokploy создать проект (или использовать существующий `oy-dashboard-ai`)
2. Добавить сервис типа **Docker Compose**, указать репо
   `ozvlcorp/oy-dashboard-ai`, файл `docker-compose.yml`
3. Прописать переменные из `.env.example` в **Environment Variables**
4. Привязать домены:
   - `api.oymoysklad.com` → сервис `backend`, порт `8000`
   - `mml.oymoysklad.com` → сервис `widget`, порт `3000`
5. Включить автодеплой по `git push`

## Связанные репозитории (устаревают)

- `ozvlcorp/mmldashboard` — текущий MML виджет (будет архивирован
  после Фазы 4)
- `ozvlcorp/widget-backend` — текущий FastAPI бекенд (будет
  архивирован после Фазы 4)
- `ozvlcorp/dashboard-widget` — старый дашборд (Фаза 5)

## Документация

- Полный план миграции — [docs/MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md)
- МойСклад JSON API 1.2 — https://dev.moysklad.ru/doc/api/remap/1.2/
- МойСклад Vendor API — https://dev.moysklad.ru/doc/api/vendor/1.0/
- Dokploy — https://dokploy.com/docs
