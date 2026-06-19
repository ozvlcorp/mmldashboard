"""
Численные утилиты для аналитики. Должны побитово совпадать с
widget/lib/utils.ts (mean, stddev) — это база всех формул.
"""
from __future__ import annotations

import math
from typing import Iterable


def safe_filter_finite(xs: Iterable[float]) -> list[float]:
    """Эквивалент TS arr.filter(Number.isFinite) — отбрасываем NaN и ±∞."""
    return [x for x in xs if math.isfinite(x)]


def mean(xs: Iterable[float]) -> float:
    """Среднее арифметическое; пустой массив → 0 (так же делает TS-версия)."""
    arr = safe_filter_finite(xs)
    return sum(arr) / len(arr) if arr else 0.0


def stddev(xs: Iterable[float]) -> float:
    """
    Стандартное отклонение по выборке (делитель n-1) — то же, что TS.
    Для массивов длины < 2 возвращает 0 (как и TS-реализация).
    """
    arr = safe_filter_finite(xs)
    if len(arr) < 2:
        return 0.0
    m = mean(arr)
    var = sum((x - m) ** 2 for x in arr) / (len(arr) - 1)
    return math.sqrt(var)


def safe_sum(xs: Iterable[float]) -> float:
    return sum(safe_filter_finite(xs))
