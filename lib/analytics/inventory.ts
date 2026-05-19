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
  mmlShareThreshold?: number; // доля валового дохода для попадания в MML (по умолчанию 15%)
};

export function buildInventoryReport(
  inputs: InventoryInput[],
  opts: InventoryOptions = {},
): InventoryReport {
  const horizonDays = opts.horizonDays ?? 10;
  const mmlThreshold = opts.mmlShareThreshold ?? 0.15;

  const partial = inputs.map((r) => {
    const stockValue = r.stock * r.costPrice;
    const stockDays = r.avgDailySales > 0 ? r.stock / r.avgDailySales : Infinity;
    const dailyGross = (r.salePrice - r.costPrice) * r.avgDailySales;
    const margin = r.salePrice > 0 ? (r.salePrice - r.costPrice) / r.salePrice : 0;
    const markup = r.costPrice > 0 ? (r.salePrice - r.costPrice) / r.costPrice : 0;

    // OOS только если запас МЕНЬШЕ норматива
    const oosLoss =
      stockDays < r.normDays ? (r.normDays - stockDays) * dailyGross : 0;
    // Замороженные деньги — только если запас БОЛЬШЕ норматива
    const frozenMoney =
      stockDays > r.normDays
        ? (stockDays - r.normDays) * r.avgDailySales * r.costPrice
        : 0;
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

  const rows: InventoryRow[] = partial.map((r) => {
    const share = totalDailyGross > 0 ? r.dailyGross / totalDailyGross : 0;
    return {
      ...r,
      share,
      mmlFlag: share >= mmlThreshold,
    };
  });

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
