"""
Parity-тесты: Python-формулы должны давать те же числа что TS.

Эталонные значения посчитаны вручную в Python через statistics-модуль
(или известны математически) и совпали с тем что показывает виджет в
браузерных verify-пробах от 2026-06-19.

Если эти тесты упадут — это значит формулы разъехались между frontend
(widget/lib/analytics/*.ts) и backend (app/analytics/*.py). НЕ принимать
такой PR в main: пользователи будут видеть РАЗНЫЕ цифры в зависимости от
того, читает виджет из snapshot или считает напрямую.
"""
from __future__ import annotations

import math

import pytest

from app.analytics.abc import AbcInput, build_abc_report, summarize_abc
from app.analytics.inventory import InventoryInput, build_inventory_report
from app.analytics.utils import mean, stddev
from app.analytics.xyz import XyzInput, build_xyz_report


# ─── Утилиты ──────────────────────────────────────────────────────────────


def test_mean_empty_returns_zero():
    assert mean([]) == 0


def test_mean_basic():
    assert mean([1, 2, 3, 4, 5]) == 3


def test_stddev_short_array_returns_zero():
    assert stddev([]) == 0
    assert stddev([5]) == 0


def test_stddev_uses_sample_n_minus_1():
    # var = ((1-3)^2 + (2-3)^2 + (3-3)^2 + (4-3)^2 + (5-3)^2) / 4 = 10/4 = 2.5
    assert stddev([1, 2, 3, 4, 5]) == pytest.approx(math.sqrt(2.5))


# ─── XYZ: 10 кейсов, которые я уже проверил через UI ──────────────────────
# Все ожидаемые значения сошлись с TS-формулой при проверке виджета —
# см. ход verify-сессии XYZ от 2026-06-19.


XYZ_CASES = [
    ("p1",  [5, 5, 5, 5, 5, 5, 5, 5],       0.0000,    "X"),
    ("p2",  [5, 5, 5, 5, 5, 5, 4, 6],       0.1069,    "Y"),
    ("p3",  [4, 5, 5, 6, 5, 4, 6, 5],       0.1512,    "Y"),
    ("p4",  [10, 2, 8, 3, 7, 4, 9, 5],      0.4880,    "Z"),
    ("p5",  [40, 0, 0, 0, 0, 0, 0, 0],      2.8284,    "Z"),
    ("p6",  [0, 0, 0, 0, 0, 0, 0, 0],       math.inf,  "Z"),
    ("p7",  [10, 0, 0, 0, 0, 0, 0, 0],      2.8284,    "Z"),
    ("p8",  [10, 10, 10, 10, 10, 10, 11, 9], 0.0535,   "X"),
    ("p9",  [100, 0, 0, 0, 0, 0, 0, 0],     2.8284,    "Z"),
    ("p10", [3, 8, 3, 8, 3, 8, 3, 8],       0.4859,    "Z"),
]


@pytest.mark.parametrize("id_,periods,expected_cv,expected_class", XYZ_CASES)
def test_xyz_parity_with_ts(id_, periods, expected_cv, expected_class):
    rows = build_xyz_report([XyzInput(id=id_, name=id_, periods=periods)])
    assert len(rows) == 1
    row = rows[0]
    if math.isinf(expected_cv):
        assert math.isinf(row.cv), f"{id_}: cv should be inf, got {row.cv}"
    else:
        assert row.cv == pytest.approx(expected_cv, abs=1e-3), (
            f"{id_}: cv={row.cv} != expected {expected_cv}"
        )
    assert row.class_ == expected_class, (
        f"{id_}: class={row.class_} != expected {expected_class}"
    )


def test_xyz_total_counts():
    """Сводка по 10 кейсам выше: ожидаем X=2, Y=2, Z=6 (совпадает с UI)."""
    inputs = [XyzInput(id=id_, name=id_, periods=ps) for id_, ps, _, _ in XYZ_CASES]
    rows = build_xyz_report(inputs)
    counts = {"X": 0, "Y": 0, "Z": 0}
    for r in rows:
        counts[r.class_] += 1
    assert counts == {"X": 2, "Y": 2, "Z": 6}


# ─── ABC ──────────────────────────────────────────────────────────────────


def test_abc_pareto_distribution():
    """
    5 товаров: 400, 300, 200, 80, 20. Total 1000.

    Кумулятивные доли:  0.40 → 0.70 → 0.90 → 0.98 → 1.00

    Правило классификации (как в TS): cls = cum <= 0.80 ? A : cum <= 0.95 ? B : C.
    Применяем cum уже ПОСЛЕ добавления текущей позиции:
      big   cum=0.40 ≤ 0.80 → A
      med   cum=0.70 ≤ 0.80 → A
      small cum=0.90 > 0.80, ≤ 0.95 → B
      tiny  cum=0.98 > 0.95 → C  (перевалила второй порог)
      dust  cum=1.00 > 0.95 → C
    Это специфика «cum после, не до» — означает что граница 95% попадает на
    позицию которая её ПЕРЕСЕКАЕТ, а не на ту что в неё впишется.
    """
    inputs = [
        AbcInput(id="big",   name="big",   value=400),
        AbcInput(id="med",   name="med",   value=300),
        AbcInput(id="small", name="small", value=200),
        AbcInput(id="tiny",  name="tiny",  value=80),
        AbcInput(id="dust",  name="dust",  value=20),
    ]
    rows = build_abc_report(inputs)
    assert [r.class_ for r in rows] == ["A", "A", "B", "C", "C"]
    assert rows[0].cum_share == pytest.approx(0.40)
    assert rows[2].cum_share == pytest.approx(0.90)
    assert rows[3].cum_share == pytest.approx(0.98)


def test_abc_empty_total_all_C():
    """Если все value <= 0 — total <= 0, все в C."""
    inputs = [AbcInput(id=f"x{i}", name=f"x{i}", value=0) for i in range(3)]
    rows = build_abc_report(inputs)
    assert all(r.class_ == "C" for r in rows)
    assert all(r.share == 0 for r in rows)


def test_abc_sort_by_value_desc():
    inputs = [
        AbcInput(id="a", name="a", value=10),
        AbcInput(id="b", name="b", value=50),
        AbcInput(id="c", name="c", value=30),
    ]
    rows = build_abc_report(inputs)
    assert [r.id for r in rows] == ["b", "c", "a"]
    assert rows[0].rank == 1


def test_abc_summarize():
    inputs = [
        AbcInput(id="big", name="big", value=800),
        AbcInput(id="med", name="med", value=150),
        AbcInput(id="tin", name="tin", value=50),
    ]
    rows = build_abc_report(inputs)
    g = summarize_abc(rows)
    assert g["A"]["count"] == 1
    assert g["A"]["share"] == pytest.approx(0.80)


# ─── INVENTORY ────────────────────────────────────────────────────────────


def test_inventory_basic_row():
    """Базовая формула: каждое поле H–Q из Excel."""
    inv = InventoryInput(
        id="p1", name="p1",
        stock=400, cost_price=5000, sale_price=6000,
        avg_daily_sales=20, norm_days=10,
    )
    rep = build_inventory_report([inv], horizon_days=10)
    r = rep.rows[0]
    assert r.stock_value == 400 * 5000        # H
    assert r.stock_days == 400 / 20           # I: 20 дней
    assert r.daily_gross == (6000 - 5000) * 20  # J: 20 000/день
    assert r.margin == pytest.approx((6000 - 5000) / 6000)
    assert r.markup == pytest.approx((6000 - 5000) / 5000)
    # stock_days(20) > norm_days(10) → oos_loss=0, frozen есть
    assert r.oos_loss == 0
    # frozen = stock_value − norm × adv × cost = 2_000_000 − 10×20×5000 = 1_000_000
    assert r.frozen_money == 1_000_000
    assert r.frozen_share == pytest.approx(0.5)


def test_inventory_oos_when_stock_below_norm():
    """Если stock_days < norm_days — есть OOS-потери."""
    inv = InventoryInput(
        id="p", name="p",
        stock=50, cost_price=100, sale_price=200,
        avg_daily_sales=10, norm_days=10,
    )
    rep = build_inventory_report([inv])
    r = rep.rows[0]
    # stock_days = 5 < 10 → OOS:
    # oos_loss = (10 − 5) × (200 − 100) × 10 = 5 × 1000 = 5000
    assert r.stock_days == 5
    assert r.oos_loss == 5000
    assert r.frozen_money == 0


def test_inventory_no_sales_no_oos_no_frozen_if_norm_zero():
    """Товар без продаж: stock_days=∞ (без NaN), oos=0 (поскольку Inf < norm = False).
    Frozen зависит от того есть ли товар на складе при норме 0."""
    inv = InventoryInput(
        id="p", name="p",
        stock=100, cost_price=50, sale_price=100,
        avg_daily_sales=0, norm_days=10,
    )
    rep = build_inventory_report([inv])
    r = rep.rows[0]
    assert math.isinf(r.stock_days)
    assert r.oos_loss == 0
    # frozen = stock_value − norm × 0 × cost = stock_value
    assert r.frozen_money == 100 * 50


def test_inventory_mml_flag_top_80_percent():
    """MML — топ товары по дневной выручке, пока суммарная доля не достигнет 80%."""
    inputs = [
        # Топ-3 дают по 30%, топ-4 = 88%
        InventoryInput(id="a", name="a", stock=10, cost_price=10, sale_price=20, avg_daily_sales=30, norm_days=10),
        InventoryInput(id="b", name="b", stock=10, cost_price=10, sale_price=20, avg_daily_sales=30, norm_days=10),
        InventoryInput(id="c", name="c", stock=10, cost_price=10, sale_price=20, avg_daily_sales=30, norm_days=10),
        InventoryInput(id="d", name="d", stock=10, cost_price=10, sale_price=20, avg_daily_sales=10, norm_days=10),
    ]
    rep = build_inventory_report(inputs)
    mml = {r.id for r in rep.rows if r.mml_flag}
    # Каждый из a/b/c даёт 30% (30%×3=90% > 80%). Алгоритм:
    # cum=0 → берём a (30%), cum=0.30 < 0.80 → берём b (60%) → берём c (90%, ≥0.80) → стоп
    # Итого: a, b, c
    assert mml == {"a", "b", "c"}


def test_inventory_totals_business_summary():
    """Бизнес-итог: lostProfit, actualProfit, profitUpliftPct."""
    inputs = [
        # дневной gross = 100, stock_days=5, norm=10 → oos_loss = 5×100=500
        InventoryInput(id="p", name="p", stock=50, cost_price=10, sale_price=20, avg_daily_sales=10, norm_days=10),
    ]
    rep = build_inventory_report(inputs, horizon_days=10)
    t = rep.totals
    # potential = 100 × 10 = 1000
    assert t.potential_profit == 1000
    assert t.lost_profit == 500
    assert t.actual_profit == 500
    assert t.profit_uplift_pct == pytest.approx(500 / 500)  # = 1.0 (100%)
    assert t.profit_uplift_x == pytest.approx(1000 / 500)   # = 2.0
