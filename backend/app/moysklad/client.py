"""
Async-клиент к МойСклад JSON API 1.2 — порт widget/lib/moysklad/browser.ts
(только серверная часть: без splitов через прокси, прямые вызовы).

ВАЖНО про rate limit: МойСклад держит около 5 rps на токен. Виджет
параллельно может ходить со своим лимитом. Чтобы не упереться в 429
вместе — наш worker кэпит concurrency до 4.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Awaitable, Callable, Optional

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://api.moysklad.ru/api/remap/1.2"
DEFAULT_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


class MsClient:
    """
    Один экземпляр на синхронизацию. Используется как `async with`:

        async with MsClient(token) as ms:
            demands = await ms.fetch_all(
                "/entity/demand",
                params={"filter": "moment>=...", "expand": "..."},
                page_size=100,
            )
    """

    def __init__(
        self,
        access_token: str,
        max_concurrency: int = 4,
        base_url: str = BASE_URL,
    ):
        self._token = access_token
        self._semaphore = asyncio.Semaphore(max_concurrency)
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept-Encoding": "gzip",
                "Accept": "application/json;charset=utf-8",
            },
            timeout=DEFAULT_TIMEOUT,
        )

    async def __aenter__(self) -> "MsClient":
        return self

    async def __aexit__(self, *args):
        await self._client.aclose()

    async def _get(self, path: str, params: Optional[dict] = None) -> Any:
        """
        Один GET с защитой от 429: если попали в rate limit — ждём столько,
        сколько просит МойСклад в заголовке X-Lognex-Retry-TimeInterval, и
        повторяем (максимум 3 попытки).
        """
        async with self._semaphore:
            for attempt in range(3):
                resp = await self._client.get(path, params=params)
                if resp.status_code == 429:
                    wait_ms = int(resp.headers.get("X-Lognex-Retry-TimeInterval", "1500"))
                    logger.warning("MS 429 on %s, retry in %dms (attempt %d)", path, wait_ms, attempt + 1)
                    await asyncio.sleep(max(0.5, wait_ms / 1000))
                    continue
                resp.raise_for_status()
                return resp.json()
            raise RuntimeError(f"too many 429s on {path}")

    async def fetch_page(
        self,
        path: str,
        params: Optional[dict] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        p = {**(params or {}), "limit": limit, "offset": offset}
        return await self._get(path, p)

    async def fetch_all(
        self,
        path: str,
        params: Optional[dict] = None,
        page_size: int = 100,
        on_progress: Optional[Callable[[int], None]] = None,
    ) -> list[dict]:
        """
        Эквивалент fetchAllParallel из browser.ts: тянем первую страницу,
        читаем meta.size, дальше параллельно (cap=semaphore) тащим остальные.
        Возвращаем плоский список rows в правильном порядке.
        """
        first = await self.fetch_page(path, params, limit=page_size, offset=0)
        rows: list = list(first.get("rows", []))
        if on_progress:
            on_progress(len(rows))

        total = (first.get("meta") or {}).get("size", len(rows))
        if len(rows) >= total:
            return rows

        offsets = list(range(len(rows), total, page_size))
        pages: list[Optional[list]] = [None] * len(offsets)

        async def fetch_one(idx: int):
            page = await self.fetch_page(path, params, limit=page_size, offset=offsets[idx])
            pages[idx] = page.get("rows", [])
            if on_progress:
                loaded = sum(len(p) for p in pages if p is not None) + len(rows)
                on_progress(loaded)

        await asyncio.gather(*(fetch_one(i) for i in range(len(offsets))))

        for page_rows in pages:
            if page_rows:
                rows.extend(page_rows)
        return rows

    # ── удобные обёртки под конкретные эндпоинты ────────────────────────

    async def fetch_assortment(self, store_href: Optional[str] = None) -> list[dict]:
        params: dict[str, Any] = {"stockStore.byStore": "true"}
        if store_href:
            params["store"] = store_href
        return await self.fetch_all("/entity/assortment", params=params, page_size=500)

    async def fetch_demands(
        self,
        from_iso: str,
        until_iso: str,
        store_href: Optional[str] = None,
        endpoint: str = "/entity/demand",
    ) -> list[dict]:
        filter_parts = [f"moment>={from_iso}", f"moment<={until_iso}"]
        if store_href:
            filter_parts.append(f"store={store_href}")
        params = {
            "filter": ";".join(filter_parts),
            "expand": "positions.assortment,agent,rate.currency",
            "order": "moment,asc",
        }
        return await self.fetch_all(endpoint, params=params, page_size=100)
