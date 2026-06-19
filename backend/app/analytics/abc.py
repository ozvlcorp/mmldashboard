"""
ABC анализ — порт widget/lib/analytics/abc.ts.

Классификация позиций по их вкладу в кумулятивную метрику (по умолчанию —
выручка). Класс A — первые ~80% (порог 0.80), B — до ~95% (порог 0.95),
C — остальное.

Сохраняем те же пороги по умолчанию и ту же логику классификации:
  cls = 'A' if cum <= 0.80 else 'B' if cum <= 0.95 else 'C'

Это специфика TS-реализации: cum обновляется ДО проверки, и первая
позиция уже может быть >0.80 — тогда A окажется пустым. Это
консистентно с тем что показывает виджет.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal


AbcClass = Literal["A", "B", "C"]


@dataclass(frozen=True)
class AbcInput:
    id: str
    name: str
    value: float


@dataclass
class AbcRow:
    id: str
    name: str
    value: float
    share: float          # доля от total
    cum_share: float      # кумулятивная доля (растёт по списку)
    rank: int             # 1..N
    class_: AbcClass


@dataclass
class AbcThresholds:
    a: float = 0.80
    b: float = 0.95


def build_abc_report(
    inputs: list[AbcInput],
    thresholds: AbcThresholds | None = None,
) -> list[AbcRow]:
    th = thresholds or AbcThresholds()

    sorted_inputs = sorted(
        (x for x in inputs if math.isfinite(x.value)),
        key=lambda r: r.value,
        reverse=True,
    )

    total = sum(max(0.0, x.value) for x in sorted_inputs)
    if total <= 0:
        return [
            AbcRow(
                id=r.id, name=r.name, value=r.value,
                share=0.0, cum_share=0.0, rank=i + 1, class_="C",
            )
            for i, r in enumerate(sorted_inputs)
        ]

    rows: list[AbcRow] = []
    cum = 0.0
    for i, r in enumerate(sorted_inputs):
        share = max(0.0, r.value) / total
        cum += share
        cls: AbcClass = "A" if cum <= th.a else ("B" if cum <= th.b else "C")
        rows.append(
            AbcRow(
                id=r.id, name=r.name, value=r.value,
                share=share, cum_share=cum, rank=i + 1, class_=cls,
            )
        )
    return rows


def summarize_abc(rows: list[AbcRow]) -> dict[str, dict[str, float]]:
    """Эквивалент summarizeAbc из TS — {A: {count, value, share}, ...}."""
    groups = {
        "A": {"count": 0, "value": 0.0, "share": 0.0},
        "B": {"count": 0, "value": 0.0, "share": 0.0},
        "C": {"count": 0, "value": 0.0, "share": 0.0},
    }
    for r in rows:
        g = groups[r.class_]
        g["count"] += 1
        g["value"] += r.value
        g["share"] += r.share
    return groups
