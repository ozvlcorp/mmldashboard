"""
Преобразование сырых данных МойСклад в формат для аналитики.
Порт widget/lib/moysklad/transform.ts. Реализовано:
  - assortment_to_inventory
  - demands_to_abc
  - demands_to_xyz
  - demands_to_rfm
Customer segments (статусы контрагентов из МойСклад) — Phase 3.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Optional

from ..analytics.abc import AbcInput
from ..analytics.inventory import InventoryInput
from ..analytics.rfm import RfmTransaction
from ..analytics.xyz import XyzInput

_UUID_RE = re.compile(r"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", re.I)


def extract_uuid(href: Optional[str]) -> Optional[str]:
    if not href:
        return None
    m = _UUID_RE.search(href)
    return m.group(1) if m else None


def assortment_to_inventory(
    items: list[dict],
    demands: list[dict],
    period_days: int,
    default_norm_days: float = 10,
) -> list[InventoryInput]:
    """
    Упрощённая версия (без курсов валют и FIFO — это Phase 3).
    avg_daily_sales считается из суммарного количества в отгрузках за период.
    """
    sales_by_product: dict[str, float] = {}
    for d in demands:
        positions = (d.get("positions") or {}).get("rows", []) or []
        for p in positions:
            href = ((p.get("assortment") or {}).get("meta") or {}).get("href")
            pid = extract_uuid(href)
            if not pid:
                continue
            sales_by_product[pid] = sales_by_product.get(pid, 0) + p.get("quantity", 0)

    result: list[InventoryInput] = []
    for it in items:
        item_id = it.get("id")
        if not item_id:
            continue
        cost_kopecks = (it.get("buyPrice") or {}).get("value", 0) or 0
        sale_kopecks = 0
        for sp in it.get("salePrices") or []:
            sale_kopecks = sp.get("value", 0) or 0
            break  # берём первую цену продажи; Phase 3 — выбор по priceType
        sold = sales_by_product.get(item_id, 0)
        avg_daily = (sold / period_days) if period_days > 0 else 0

        result.append(InventoryInput(
            id=item_id,
            name=it.get("name", item_id),
            stock=it.get("stock", 0) or 0,
            cost_price=cost_kopecks / 100,   # МойСклад хранит цены в копейках
            sale_price=sale_kopecks / 100,
            avg_daily_sales=avg_daily,
            norm_days=default_norm_days,
        ))
    return result


def demands_to_abc(demands: list[dict]) -> list[AbcInput]:
    """
    Сумма по позициям (после скидки) в копейках → делим на 100.
    Точно так же как в TS-версии: price * quantity * (1 - discount/100) / 100.
    """
    agg: dict[str, dict[str, Any]] = {}
    for d in demands:
        positions = (d.get("positions") or {}).get("rows", []) or []
        for p in positions:
            href = ((p.get("assortment") or {}).get("meta") or {}).get("href")
            pid = extract_uuid(href)
            if not pid:
                continue
            discount = max(0.0, min(100.0, float(p.get("discount") or 0))) / 100.0
            value = (p.get("price", 0) * p.get("quantity", 0) * (1 - discount)) / 100.0
            name = (p.get("assortment") or {}).get("name") or pid
            row = agg.get(pid)
            if row:
                row["value"] += value
            else:
                agg[pid] = {"name": name, "value": value}

    return [AbcInput(id=pid, name=row["name"], value=row["value"]) for pid, row in agg.items()]


def demands_to_xyz(
    demands: list[dict],
    until: datetime,
    bucket_days: int = 7,
    periods_count: int = 8,
) -> list[XyzInput]:
    """
    Группирует отгрузки по SKU и недельным бакетам. Старые слева, новые
    справа — как в TS-версии.
    """
    agg: dict[str, dict[str, Any]] = {}
    until_ts = until.timestamp()
    for d in demands:
        moment_str = d.get("moment")
        if not moment_str:
            continue
        try:
            # МойСклад отдаёт moment в формате "2024-05-13 10:30:00.000"
            # либо ISO. Парсим оба варианта.
            moment_dt = _parse_ms_moment(moment_str)
        except Exception:
            continue
        age_days = max(0, int((until_ts - moment_dt.timestamp()) // 86400))
        bucket = age_days // bucket_days
        if bucket >= periods_count:
            continue
        idx = periods_count - 1 - bucket  # старые слева

        positions = (d.get("positions") or {}).get("rows", []) or []
        for p in positions:
            href = ((p.get("assortment") or {}).get("meta") or {}).get("href")
            pid = extract_uuid(href)
            if not pid:
                continue
            row = agg.get(pid)
            if not row:
                row = {"name": (p.get("assortment") or {}).get("name") or pid,
                       "periods": [0.0] * periods_count}
                agg[pid] = row
            row["periods"][idx] += p.get("quantity", 0)

    return [XyzInput(id=pid, name=row["name"], periods=row["periods"]) for pid, row in agg.items()]


def _parse_ms_moment(s: str) -> datetime:
    """
    МойСклад moment: "2024-05-13 10:30:00.000" (с пробелом, без таймзоны
    — Moscow). На крайний случай поддерживаем ISO. Тз игнорируем —
    моменты сравниваем с naive `until` через timestamp.
    """
    try:
        return datetime.fromisoformat(s.replace(" ", "T"))
    except ValueError:
        # Если пришёл без миллисекунд
        return datetime.strptime(s, "%Y-%m-%d %H:%M:%S")


def demands_to_rfm(demands: list[dict]) -> list[RfmTransaction]:
    """
    Каждая отгрузка → одна RFM-транзакция (agent = клиент). Порт
    demandsToRfm из TS. Используем d.sum (в копейках) делим на 100 →
    базовая валюта аккаунта. Демонстрации без agent отбрасываем —
    встречаются на retaildemand с анонимной розничной продажей.
    """
    out: list[RfmTransaction] = []
    for d in demands:
        agent = d.get("agent") or {}
        href = (agent.get("meta") or {}).get("href")
        if not href:
            continue
        customer_id = extract_uuid(href) or href
        moment_str = d.get("moment")
        if not moment_str:
            continue
        try:
            date = _parse_ms_moment(moment_str)
        except Exception:
            continue
        out.append(RfmTransaction(
            customer_id=customer_id,
            customer_name=agent.get("name"),
            date=date,
            amount=(d.get("sum", 0) or 0) / 100,
        ))
    return out
