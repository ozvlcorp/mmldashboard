"""
XYZ анализ — порт widget/lib/analytics/xyz.ts.

Классификация товаров по стабильности спроса через коэффициент вариации
(CV = stddev / mean) на бакетах продаж.

  X: CV ≤ 0.10  (стабильный спрос, можно JIT)
  Y: 0.10 < CV ≤ 0.25  (умеренные колебания)
  Z: CV > 0.25  (нерегулярный, нужен страховой запас)

Краевые случаи (повторяют TS):
- Пустой массив periods   → mean=0, cv=Infinity, класс Z
- mean == 0 (все нули)    → cv=Infinity, класс Z
- Один ненулевой бакет    → высокий cv, класс Z
- Все элементы равны      → cv=0, класс X

Используется ВЫБОРОЧНОЕ стандартное отклонение (n-1) — так же как
lib/utils.ts:stddev. На бакетах из 8 значений это слегка завышает CV
по сравнению с популяционной формулой (n), но «корректнее» для прогноза.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

from .utils import mean, stddev, safe_filter_finite


XyzClass = Literal["X", "Y", "Z"]


@dataclass(frozen=True)
class XyzInput:
    id: str
    name: str
    periods: list[float]


@dataclass
class XyzRow:
    id: str
    name: str
    mean: float
    stddev: float
    cv: float            # может быть math.inf
    class_: XyzClass
    total_sales: float
    periods_count: int


@dataclass
class XyzThresholds:
    x: float = 0.10
    y: float = 0.25


def build_xyz_report(
    inputs: list[XyzInput],
    thresholds: XyzThresholds | None = None,
) -> list[XyzRow]:
    th = thresholds or XyzThresholds()
    rows: list[XyzRow] = []
    for r in inputs:
        xs = safe_filter_finite(r.periods)
        m = mean(xs)
        sd = stddev(xs)
        cv = (sd / m) if m > 0 else math.inf
        cls: XyzClass = "X" if cv <= th.x else ("Y" if cv <= th.y else "Z")
        rows.append(
            XyzRow(
                id=r.id, name=r.name,
                mean=m, stddev=sd, cv=cv, class_=cls,
                total_sales=sum(xs),
                periods_count=len(xs),
            )
        )
    return rows
