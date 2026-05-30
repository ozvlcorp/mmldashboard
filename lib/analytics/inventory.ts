/**
 * Складская аналитика по формулам исходной таблицы ОМБОР аналитикаси.
 * Использует исправленные диапазоны и добавляет построчный расчёт замороженных денег.
 */

export type InventoryInput = {
  id: string;
  name: string;
  stock: number;          // C: остаток, шт
  costPrice: number;      // D: закупочная цена
  salePrice: number;      // E: цена продажи
  avgDailySales: number;  // F: средние продажи в день, шт
  normDays: number;       // G: норматив запаса, дней
};

export type InventoryRow = InventoryInput & {
  stockValue: number;      // H: остаток в деньгах = stock * costPrice
  stockDays: number;       // I: запас в днях = stock / avgDailySales
  dailyGross: number;      // J: дневной валовый доход = (sale-cost)*avgDailySales
  share: number;           // K: доля в общем валовом доходе
  margin: number;          // M: маржа = (sale-cost)/sale
  markup: number;          // N: наценка = (sale-cost)/cost
  oosLoss: number;         // O: потери из-за OOS (если stockDays < normDays)
  frozenMoney: number;     // P: замороженные деньги (если stockDays > normDays)
  frozenShare: number;     // Q: доля замороженных от стоимости остатка
  mmlFlag: boolean;        // L: попал ли товар в MML
};

export type InventoryTotals = {
  stockValue: number;
  dailyGross: number;
  mmlShare: number;        // суммарная доля MML товаров
  oosLoss: number;
  frozenMoney: number;
  frozenShare: number;
  // Бизнес-итог на горизонте N дней
  horizonDays: number;
  potentialProfit: number;  // максимально возможная прибыль за horizon
  lostProfit: number;       // потери из-за OOS за horizon
  actualProfit: number;     // фактическая прибыль за horizon
  profitUpliftPct: number;  // на сколько % выросла бы прибыль при OOS=0
  profitUpliftX: number;    // во сколько раз выросла бы прибыль
};

export type InventoryReport = {
  rows: InventoryRow[];
  totals: InventoryTotals;
};

export type InventoryOptions = {
  horizonDays?: number;     // горизонт расчёта (по умолчанию 10 как в исходной таблице)
  /**
   * Кумулятивная доля выручки для попадания в MML.
   * Сортируем товары по share по убыванию и помечаем верхние, пока их
   * суммарная доля не достигнет порога. По умолчанию 0.80 (≈ABC класс A).
   * Раньше использовалось per-item threshold 15% — это работало только
   * на маленьких каталогах (10-50 SKU). На каталоге в 1000+ SKU ни один
   * товар по отдельности не наберёт 15%, и MML всегда был пустым.
   */
  mmlCumulativeShare?: number;
};

export function buildInventoryReport(
  inputs: InventoryInput[],
  opts: InventoryOptions = {},
): InventoryReport {
  const horizonDays = opts.horizonDays ?? 10;
  const mmlCum = opts.mmlCumulativeShare ?? 0.80;

  const partial = inputs.map((r) => {
    const stockValue = r.stock * r.costPrice;
    const stockDays = r.avgDailySales > 0 ? r.stock / r.avgDailySales : Infinity;
    const dailyGross = (r.salePrice - r.costPrice) * r.avgDailySales;
    const margin = r.salePrice > 0 ? (r.salePrice - r.costPrice) / r.salePrice : 0;
    const markup = r.costPrice > 0 ? (r.salePrice - r.costPrice) / r.costPrice : 0;

    // OOS только если запас МЕНЬШЕ норматива (avgDailySales=0 → stockDays=∞ → false → 0)
    const oosLoss =
      stockDays < r.normDays ? (r.normDays - stockDays) * dailyGross : 0;
    // Замороженные деньги = всё, что лежит на складе сверх норматива.
    // Эквивалентная формула: stockValue - normDays * avgDailySales * costPrice
    // (избегает Infinity * 0 = NaN, когда avgDailySales = 0)
    const frozenMoney = Math.max(
      0,
      stockValue - r.normDays * r.avgDailySales * r.costPrice,
    );
    const frozenShare = stockValue > 0 ? frozenMoney / stockValue : 0;

    return {
      ...r,
      stockValue,
      stockDays,
      dailyGross,
      margin,
      markup,
      oosLoss,
      frozenMoney,
      frozenShare,
    };
  });

  const totalDailyGross = partial.reduce((s, x) => s + x.dailyGross, 0);

  const withShare = partial.map((r) => ({
    ...r,
    share: totalDailyGross > 0 ? r.dailyGross / totalDailyGross : 0,
  }));

  // Помечаем верхние товары по выручке, пока их суммарная доля не достигнет порога
  const mmlIds = new Set<string>();
  if (mmlCum > 0 && totalDailyGross > 0) {
    const sorted = [...withShare].sort((a, b) => b.share - a.share);
    let cum = 0;
    for (const r of sorted) {
      if (cum >= mmlCum) break;
      if (r.share <= 0) break; // не помечаем товары без продаж
      mmlIds.add(r.id);
      cum += r.share;
    }
  }

  const rows: InventoryRow[] = withShare.map((r) => ({
    ...r,
    mmlFlag: mmlIds.has(r.id),
  }));

  const stockValueT = rows.reduce((s, x) => s + x.stockValue, 0);
  const oosLossT = rows.reduce((s, x) => s + x.oosLoss, 0);
  const frozenT = rows.reduce((s, x) => s + x.frozenMoney, 0);
  const mmlShare = rows.filter((r) => r.mmlFlag).reduce((s, x) => s + x.share, 0);

  const potentialProfit = totalDailyGross * horizonDays;
  const lostProfit = oosLossT;
  const actualProfit = potentialProfit - lostProfit;
  const profitUpliftPct = actualProfit > 0 ? lostProfit / actualProfit : 0;
  const profitUpliftX = actualProfit > 0 ? potentialProfit / actualProfit : 0;

  return {
    rows,
    totals: {
      stockValue: stockValueT,
      dailyGross: totalDailyGross,
      mmlShare,
      oosLoss: oosLossT,
      frozenMoney: frozenT,
      frozenShare: stockValueT > 0 ? frozenT / stockValueT : 0,
      horizonDays,
      potentialProfit,
      lostProfit,
      actualProfit,
      profitUpliftPct,
      profitUpliftX,
    },
  };
}
