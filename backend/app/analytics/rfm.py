"""
RFM анализ — порт widget/lib/analytics/rfm.ts.

Сегментация клиентов по трём метрикам:
  R (Recency)   — дней с последней покупки (меньше = лучше)
  F (Frequency) — число покупок
  M (Monetary)  — суммарная выручка

Каждой метрике — балл 1-5 по квинтилям. Сегмент определяется по матрице
(r, f, m). Логика и пороги сегментов один-в-один с TS-версией.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from typing import Literal


RfmSegment = Literal[
    "Champions",
    "Loyal",
    "Potential Loyal",
    "New",
    "Promising",
    "Need Attention",
    "At Risk",
    "Hibernating",
    "Lost",
]


@dataclass(frozen=True)
class RfmTransaction:
    customer_id: str
    customer_name: str | None
    date: datetime
    amount: float


@dataclass
class RfmCustomer:
    id: str
    name: str
    recency_days: int     # дни с последней покупки
    frequency: int        # число покупок
    monetary: float       # суммарная выручка


@dataclass
class RfmScored:
    id: str
    name: str
    recency_days: int
    frequency: int
    monetary: float
    r_score: int          # 1..5 (5 = недавно покупал)
    f_score: int          # 1..5 (5 = много покупок)
    m_score: int          # 1..5 (5 = большой чек)
    rfm: str              # "555"
    segment: RfmSegment


def aggregate_transactions(
    txs: list[RfmTransaction],
    ref_date: datetime,
) -> list[RfmCustomer]:
    """Группируем транзакции по customer_id, агрегируем R/F/M."""
    by_id: dict[str, RfmCustomer] = {}
    for t in txs:
        if not math.isfinite(t.date.timestamp()):
            continue
        age_ms = ref_date.timestamp() - t.date.timestamp()
        age_days = max(0, int(age_ms // 86400))
        prev = by_id.get(t.customer_id)
        if prev is None:
            by_id[t.customer_id] = RfmCustomer(
                id=t.customer_id,
                name=t.customer_name or t.customer_id,
                recency_days=age_days,
                frequency=1,
                monetary=t.amount,
            )
        else:
            prev.recency_days = min(prev.recency_days, age_days)
            prev.frequency += 1
            prev.monetary += t.amount
            if t.customer_name:
                prev.name = t.customer_name
    return list(by_id.values())


def _quintile_score(value: float, sorted_asc: list[float], invert: bool = False) -> int:
    """
    Балл 1..5 по квинтилю. Алгоритм идентичен TS-версии:
    - Если значений < 5 — линейная нормализация min..max в 1..5.
    - Если значений >= 5 — позиция в отсортированном массиве делится на 5.
    invert=True для recency (меньше = лучше).
    """
    if not sorted_asc:
        return 1
    if len(sorted_asc) < 5:
        m = max(sorted_asc)
        mn = min(sorted_asc)
        if m == mn:
            return 3
        ratio = (value - mn) / (m - mn)
        s = min(5, max(1, math.ceil(ratio * 5)))
        return 6 - s if invert else s
    n = len(sorted_asc)
    # findIndex эквивалент: первый индекс где sorted_asc[i] >= value
    idx = next((i for i, v in enumerate(sorted_asc) if v >= value), -1)
    rank = n if idx == -1 else idx + 1
    q = min(5, max(1, math.ceil((rank / n) * 5)))
    return 6 - q if invert else q


def _segment_of(r: int, f: int, m: int) -> RfmSegment:
    """Матрица сегментов из TS-версии (порядок важен — first-match)."""
    fm = (f + m) / 2
    if r >= 4 and fm >= 4:
        return "Champions"
    if r >= 3 and fm >= 3:
        return "Loyal"
    if r >= 4 and fm >= 2:
        return "Potential Loyal"
    if r == 5 and f == 1:
        return "New"
    if r >= 3 and fm <= 2:
        return "Promising"
    if r == 3 and fm >= 3:
        return "Need Attention"
    if r <= 2 and fm >= 3:
        return "At Risk"
    if r <= 2 and fm == 2:
        return "Hibernating"
    return "Lost"


def score_customers(customers: list[RfmCustomer]) -> list[RfmScored]:
    if not customers:
        return []
    r_sorted = sorted(c.recency_days for c in customers)
    f_sorted = sorted(c.frequency for c in customers)
    m_sorted = sorted(c.monetary for c in customers)

    result: list[RfmScored] = []
    for c in customers:
        r_score = _quintile_score(c.recency_days, r_sorted, invert=True)
        f_score = _quintile_score(c.frequency, f_sorted)
        m_score = _quintile_score(c.monetary, m_sorted)
        result.append(RfmScored(
            id=c.id, name=c.name,
            recency_days=c.recency_days,
            frequency=c.frequency,
            monetary=c.monetary,
            r_score=r_score,
            f_score=f_score,
            m_score=m_score,
            rfm=f"{r_score}{f_score}{m_score}",
            segment=_segment_of(r_score, f_score, m_score),
        ))
    return result


def build_rfm_report(
    txs: list[RfmTransaction],
    reference_date: datetime | None = None,
) -> list[RfmScored]:
    ref = reference_date or datetime.now()
    customers = aggregate_transactions(txs, ref)
    scored = score_customers(customers)
    # Сортировка по monetary desc — самые ценные клиенты первыми
    scored.sort(key=lambda s: s.monetary, reverse=True)
    return scored


def summarize_rfm(scored: list[RfmScored]) -> dict[str, dict[str, float]]:
    """Эквивалент summarizeRfm: {segment: {count, revenue}}."""
    result: dict[str, dict[str, float]] = {}
    for s in scored:
        bucket = result.setdefault(s.segment, {"count": 0, "revenue": 0.0})
        bucket["count"] += 1
        bucket["revenue"] += s.monetary
    return result
