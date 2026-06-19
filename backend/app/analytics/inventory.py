"""
Складская аналитика — порт widget/lib/analytics/inventory.ts.

Формулы один-в-один с Excel-таблицей ОМБОР аналитикаси, на которые
опирается клиент:
  H stockValue   = stock × costPrice
  I stockDays    = stock / avgDailySales   (∞ если avgDailySales == 0)
  J dailyGross   = (salePrice − costPrice) × avgDailySales
  K share        = dailyGross / SUM(dailyGross)
  L mmlFlag      = TRUE для топ-товаров пока их кумулятивная доля ≤ mml_cumulative_share
  M margin       = (salePrice − costPrice) / salePrice
  N markup       = (salePrice − costPrice) / costPrice
  O oosLoss      = (normDays − stockDays) × dailyGross   (только если stockDays < normDays)
  P frozenMoney  = max(0, stockValue − normDays × avgDailySales × costPrice)
  Q frozenShare  = frozenMoney / stockValue

Бизнес-итог на горизонте N дней:
  potentialProfit = SUM(dailyGross) × horizon
  lostProfit      = SUM(oosLoss)
  actualProfit    = potentialProfit − lostProfit
  profitUpliftPct = lostProfit / actualProfit      (если actualProfit > 0)
  profitUpliftX   = potentialProfit / actualProfit (если actualProfit > 0)
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class InventoryInput:
    id: str
    name: str
    stock: float
    cost_price: float
    sale_price: float
    avg_daily_sales: float
    norm_days: float
    buy_currency: Optional[str] = None
    sale_currency: Optional[str] = None
    cost_price_original: Optional[float] = None
    sale_price_original: Optional[float] = None
    converted: bool = False
    cost_from_fifo: bool = False


@dataclass
class InventoryRow:
    id: str
    name: str
    stock: float
    cost_price: float
    sale_price: float
    avg_daily_sales: float
    norm_days: float
    stock_value: float
    stock_days: float
    daily_gross: float
    share: float
    margin: float
    markup: float
    oos_loss: float
    frozen_money: float
    frozen_share: float
    mml_flag: bool
    buy_currency: Optional[str] = None
    sale_currency: Optional[str] = None
    cost_price_original: Optional[float] = None
    sale_price_original: Optional[float] = None
    converted: bool = False
    cost_from_fifo: bool = False


@dataclass
class InventoryTotals:
    stock_value: float
    daily_gross: float
    mml_share: float
    oos_loss: float
    frozen_money: float
    frozen_share: float
    horizon_days: float
    potential_profit: float
    lost_profit: float
    actual_profit: float
    profit_uplift_pct: float
    profit_uplift_x: float


@dataclass
class InventoryReport:
    rows: list[InventoryRow]
    totals: InventoryTotals


def build_inventory_report(
    inputs: list[InventoryInput],
    horizon_days: float = 10,
    mml_cumulative_share: float = 0.80,
) -> InventoryReport:
    partial: list[dict] = []
    for r in inputs:
        stock_value = r.stock * r.cost_price
        stock_days = (r.stock / r.avg_daily_sales) if r.avg_daily_sales > 0 else math.inf
        daily_gross = (r.sale_price - r.cost_price) * r.avg_daily_sales
        margin = ((r.sale_price - r.cost_price) / r.sale_price) if r.sale_price > 0 else 0.0
        markup = ((r.sale_price - r.cost_price) / r.cost_price) if r.cost_price > 0 else 0.0

        oos_loss = ((r.norm_days - stock_days) * daily_gross) if stock_days < r.norm_days else 0.0
        # Эквивалентная формула — избегает Infinity * 0 = NaN когда avg_daily_sales = 0
        frozen_money = max(0.0, stock_value - r.norm_days * r.avg_daily_sales * r.cost_price)
        frozen_share = (frozen_money / stock_value) if stock_value > 0 else 0.0

        partial.append({
            "input": r,
            "stock_value": stock_value,
            "stock_days": stock_days,
            "daily_gross": daily_gross,
            "margin": margin,
            "markup": markup,
            "oos_loss": oos_loss,
            "frozen_money": frozen_money,
            "frozen_share": frozen_share,
        })

    total_daily_gross = sum(p["daily_gross"] for p in partial)

    for p in partial:
        p["share"] = (p["daily_gross"] / total_daily_gross) if total_daily_gross > 0 else 0.0

    # MML: топ товары по выручке, пока кумулятивная доля не достигнет порога
    mml_ids: set[str] = set()
    if mml_cumulative_share > 0 and total_daily_gross > 0:
        sorted_by_share = sorted(partial, key=lambda x: x["share"], reverse=True)
        cum = 0.0
        for p in sorted_by_share:
            if cum >= mml_cumulative_share:
                break
            if p["share"] <= 0:
                break
            mml_ids.add(p["input"].id)
            cum += p["share"]

    rows: list[InventoryRow] = []
    for p in partial:
        r = p["input"]
        rows.append(InventoryRow(
            id=r.id, name=r.name,
            stock=r.stock, cost_price=r.cost_price, sale_price=r.sale_price,
            avg_daily_sales=r.avg_daily_sales, norm_days=r.norm_days,
            stock_value=p["stock_value"],
            stock_days=p["stock_days"],
            daily_gross=p["daily_gross"],
            share=p["share"],
            margin=p["margin"],
            markup=p["markup"],
            oos_loss=p["oos_loss"],
            frozen_money=p["frozen_money"],
            frozen_share=p["frozen_share"],
            mml_flag=r.id in mml_ids,
            buy_currency=r.buy_currency, sale_currency=r.sale_currency,
            cost_price_original=r.cost_price_original,
            sale_price_original=r.sale_price_original,
            converted=r.converted, cost_from_fifo=r.cost_from_fifo,
        ))

    stock_value_t = sum(x.stock_value for x in rows)
    oos_loss_t = sum(x.oos_loss for x in rows)
    frozen_t = sum(x.frozen_money for x in rows)
    mml_share = sum(x.share for x in rows if x.mml_flag)

    potential_profit = total_daily_gross * horizon_days
    lost_profit = oos_loss_t
    actual_profit = potential_profit - lost_profit
    profit_uplift_pct = (lost_profit / actual_profit) if actual_profit > 0 else 0.0
    profit_uplift_x = (potential_profit / actual_profit) if actual_profit > 0 else 0.0

    return InventoryReport(
        rows=rows,
        totals=InventoryTotals(
            stock_value=stock_value_t,
            daily_gross=total_daily_gross,
            mml_share=mml_share,
            oos_loss=oos_loss_t,
            frozen_money=frozen_t,
            frozen_share=(frozen_t / stock_value_t) if stock_value_t > 0 else 0.0,
            horizon_days=horizon_days,
            potential_profit=potential_profit,
            lost_profit=lost_profit,
            actual_profit=actual_profit,
            profit_uplift_pct=profit_uplift_pct,
            profit_uplift_x=profit_uplift_x,
        ),
    )
