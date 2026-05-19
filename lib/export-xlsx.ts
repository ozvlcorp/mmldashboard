'use client';

import * as XLSX from 'xlsx';

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
  width?: number;
};

export function exportXlsx<T>(opts: {
  filename: string;
  sheetName?: string;
  rows: T[];
  columns: ExportColumn<T>[];
}): void {
  const { filename, sheetName = 'Data', rows, columns } = opts;
  const aoa: (string | number | null)[][] = [];

  aoa.push(columns.map((c) => c.header));
  for (const row of rows) {
    aoa.push(
      columns.map((c) => {
        const v = c.value(row);
        if (v === null || v === undefined) return null;
        if (typeof v === 'number' && !Number.isFinite(v)) return null;
        return v;
      }),
    );
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 16 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename.replace('.xlsx', '') + `_${date}.xlsx`);
}
