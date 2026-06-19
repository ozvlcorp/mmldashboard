/**
 * Demo-данные для предпросмотра без подключения к МойСклад.
 * Исходные значения — из таблицы ОМБОР аналитикаси.
 */

import type { InventoryInput } from './analytics/inventory';
import type { AbcInput } from './analytics/abc';
import type { XyzInput } from './analytics/xyz';
import type { RfmTransaction } from './analytics/rfm';
import type { DebtCandidate } from './moysklad/debts';

export const DEMO_INVENTORY: InventoryInput[] = [
  { id: '1', name: 'Маҳсулот №1', stock: 400, costPrice: 5000, salePrice: 6000, avgDailySales: 20, normDays: 10 },
  { id: '2', name: 'Маҳсулот №2', stock: 350, costPrice: 60000, salePrice: 75000, avgDailySales: 5, normDays: 10 },
  { id: '3', name: 'Маҳсулот №3', stock: 5000, costPrice: 2000, salePrice: 2200, avgDailySales: 2000, normDays: 10 },
  { id: '4', name: 'Маҳсулот №4', stock: 85, costPrice: 50000, salePrice: 60000, avgDailySales: 3, normDays: 10 },
  { id: '5', name: 'Маҳсулот №5', stock: 35, costPrice: 30000, salePrice: 35000, avgDailySales: 10, normDays: 10 },
  { id: '6', name: 'Маҳсулот №6', stock: 460, costPrice: 2500, salePrice: 3500, avgDailySales: 200, normDays: 10 },
  { id: '7', name: 'Маҳсулот №7', stock: 5000, costPrice: 10000, salePrice: 13000, avgDailySales: 20, normDays: 10 },
  { id: '8', name: 'Маҳсулот №8', stock: 5, costPrice: 8000, salePrice: 10000, avgDailySales: 20, normDays: 10 },
  { id: '9', name: 'Маҳсулот №9', stock: 225, costPrice: 15000, salePrice: 16000, avgDailySales: 100, normDays: 10 },
  { id: '10', name: 'Маҳсулот №10', stock: 3000, costPrice: 20000, salePrice: 30000, avgDailySales: 10, normDays: 10 },
];

// Выручка за период — для ABC берём дневную выручку = avgDaily * salePrice
export const DEMO_ABC: AbcInput[] = DEMO_INVENTORY.map((r) => ({
  id: r.id,
  name: r.name,
  value: r.avgDailySales * r.salePrice * 30, // 30 дней
}));

// XYZ — симулируем 8 периодов (недель) для каждого товара
// На основе средних дневных продаж с разной волатильностью
function simulatePeriods(avg: number, volatility: number, count = 8): number[] {
  let seed = 42 + Math.floor(avg * 1000);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({ length: count }, () => {
    const weekly = avg * 7;
    const noise = (rand() - 0.5) * 2 * volatility * weekly;
    return Math.max(0, Math.round(weekly + noise));
  });
}

export const DEMO_XYZ: XyzInput[] = [
  { id: '1', name: 'Маҳсулот №1', periods: simulatePeriods(20, 0.05) }, // X — стабильный
  { id: '2', name: 'Маҳсулот №2', periods: simulatePeriods(5, 0.4) },   // Z — нерегулярный
  { id: '3', name: 'Маҳсулот №3', periods: simulatePeriods(2000, 0.07) },
  { id: '4', name: 'Маҳсулот №4', periods: simulatePeriods(3, 0.5) },
  { id: '5', name: 'Маҳсулот №5', periods: simulatePeriods(10, 0.15) }, // Y
  { id: '6', name: 'Маҳсулот №6', periods: simulatePeriods(200, 0.08) },
  { id: '7', name: 'Маҳсулот №7', periods: simulatePeriods(20, 0.18) }, // Y
  { id: '8', name: 'Маҳсулот №8', periods: simulatePeriods(20, 0.35) }, // Z
  { id: '9', name: 'Маҳсулот №9', periods: simulatePeriods(100, 0.06) },
  { id: '10', name: 'Маҳсулот №10', periods: simulatePeriods(10, 0.45) },
];

// RFM — генерим клиентов с разными паттернами
const baseDate = new Date('2026-05-19T00:00:00Z');
function dt(daysAgo: number): string {
  return new Date(baseDate.getTime() - daysAgo * 86400000).toISOString();
}

export const DEMO_RFM: RfmTransaction[] = [
  // Чемпионы — частые, недавние, большие чеки
  ...repeat(8, (i) => ({ customerId: 'c1', customerName: 'ООО "Альфа"', date: dt(i * 4), amount: 1_200_000 })),
  ...repeat(7, (i) => ({ customerId: 'c2', customerName: 'ИП Бекзод', date: dt(i * 5), amount: 900_000 })),
  // Лояльные — регулярные, средний чек
  ...repeat(5, (i) => ({ customerId: 'c3', customerName: 'ООО "Гамма"', date: dt(15 + i * 7), amount: 500_000 })),
  ...repeat(4, (i) => ({ customerId: 'c4', customerName: 'Магазин на Чиланзаре', date: dt(20 + i * 10), amount: 400_000 })),
  // Перспективные — недавно купили мало
  { customerId: 'c5', customerName: 'ИП Дилшод', date: dt(5), amount: 150_000 },
  { customerId: 'c6', customerName: 'ООО "Новые"', date: dt(10), amount: 200_000 },
  // В зоне риска — давно не покупали, но в прошлом активны
  ...repeat(6, (i) => ({ customerId: 'c7', customerName: 'ООО "Дельта"', date: dt(120 + i * 10), amount: 800_000 })),
  ...repeat(4, (i) => ({ customerId: 'c8', customerName: 'ТД "Бухара"', date: dt(180 + i * 15), amount: 600_000 })),
  // Спящие
  { customerId: 'c9', customerName: 'ООО "Зима"', date: dt(200), amount: 300_000 },
  { customerId: 'c10', customerName: 'ИП Жасур', date: dt(250), amount: 250_000 },
  // Потерянные
  { customerId: 'c11', customerName: 'ООО "Архив"', date: dt(400), amount: 100_000 },
];

function repeat<T>(n: number, fn: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => fn(i));
}

export const DEMO_DEBTORS: DebtCandidate[] = [
  {
    demandId: 'd-001',
    demandName: 'Отгрузка №00125',
    demandMoment: dt(45),
    demandSum: 3_500_000,
    counterpartyId: 'c-101',
    counterpartyName: 'ООО "Дельта Маркет"',
    counterpartyPhone: '+998901234567',
    balance: -3_500_000,
    debtAmount: 3_500_000,
  },
  {
    demandId: 'd-002',
    demandName: 'Отгрузка №00131',
    demandMoment: dt(38),
    demandSum: 1_800_000,
    counterpartyId: 'c-102',
    counterpartyName: 'ТД "Бухара"',
    counterpartyPhone: '+998935551122',
    balance: -1_200_000,
    debtAmount: 1_200_000,
  },
  {
    demandId: 'd-003',
    demandName: 'Отгрузка №00147',
    demandMoment: dt(60),
    demandSum: 950_000,
    counterpartyId: 'c-103',
    counterpartyName: 'ИП Жасур',
    counterpartyPhone: '+998977778899',
    balance: -950_000,
    debtAmount: 950_000,
  },
  {
    demandId: 'd-004',
    demandName: 'Отгрузка №00152',
    demandMoment: dt(30),
    demandSum: 6_200_000,
    counterpartyId: 'c-104',
    counterpartyName: 'Магазин на Чиланзаре',
    balance: -4_800_000,
    debtAmount: 4_800_000,
  },
];
