'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoHint } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { exportXlsx, type ExportColumn } from '@/lib/export-xlsx';

export type Column<T> = {
  key: string;
  header: string;
  /** Подсказка-объяснение — рендерится как (?) icon с tooltip */
  help?: string;
  align?: 'left' | 'right' | 'center';
  width?: number;          // px, начальная ширина
  minWidth?: number;       // px, мин при resize
  render: (row: T, index: number) => React.ReactNode;
  sortAccessor?: (row: T) => number | string;
  /** Маппер для xlsx-экспорта. Если отсутствует, столбец в файл не попадает. */
  exportValue?: (row: T) => string | number | null | undefined;
  /** Заголовок для xlsx (если отличается от UI header) */
  exportHeader?: string;
  /** Скрыть колонку в UI (но оставить для экспорта). */
  hidden?: boolean;
};

export function DataTable<T>({
  data,
  columns,
  defaultSort,
  rowKey,
  className,
  tableId,
  exportName,
  toolbar,
  pageSize = 100,
}: {
  data: T[];
  columns: Column<T>[];
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  rowKey: (row: T, index: number) => string;
  className?: string;
  /** Уникальный id таблицы — для localStorage с пользовательскими шириной столбцов */
  tableId?: string;
  /** Имя файла при экспорте. Если задано — отображается кнопка «Excel». */
  exportName?: string;
  /** Произвольный элемент справа от тулбара (фильтры и пр.) */
  toolbar?: React.ReactNode;
  /** Сколько строк на страницу. По умолчанию 100. 0 — без пагинации. */
  pageSize?: number;
}) {
  const [sort, setSort] = React.useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    defaultSort ?? null,
  );

  const [widths, setWidths] = React.useState<Record<string, number>>(() => {
    if (typeof window === 'undefined' || !tableId) return {};
    try {
      const raw = localStorage.getItem(`oy-cols-${tableId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    if (!tableId) return;
    try {
      localStorage.setItem(`oy-cols-${tableId}`, JSON.stringify(widths));
    } catch {
      /* quota */
    }
  }, [widths, tableId]);

  const resizingRef = React.useRef<{ key: string; startX: number; startWidth: number } | null>(
    null,
  );

  const onResizeStart = (e: React.PointerEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).parentElement;
    if (!th) return;
    const startWidth = th.getBoundingClientRect().width;
    resizingRef.current = { key, startX: e.clientX, startWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: PointerEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const col = columns.find((c) => c.key === r.key);
      const min = col?.minWidth ?? 60;
      const next = Math.max(min, r.startWidth + (ev.clientX - r.startX));
      setWidths((prev) => ({ ...prev, [r.key]: next }));
    };
    const onUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const sorted = React.useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortAccessor) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = col.sortAccessor!(a);
      const bv = col.sortAccessor!(b);
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [data, sort, columns]);

  const visibleColumns = React.useMemo(() => columns.filter((c) => !c.hidden), [columns]);

  const [page, setPage] = React.useState(0);
  const totalRows = sorted.length;
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;
  // если фильтр/сортировка уменьшили число строк — возвращаемся на валидную страницу
  React.useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [totalPages, page]);

  const pageRows = React.useMemo(() => {
    if (pageSize <= 0) return sorted;
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const showPagination = pageSize > 0 && totalRows > pageSize;
  const firstRowOnPage = totalRows === 0 ? 0 : page * pageSize + 1;
  const lastRowOnPage = Math.min(totalRows, (page + 1) * pageSize);

  const handleExport = () => {
    if (!exportName) return;
    const exportCols: ExportColumn<T>[] = columns
      .filter((c) => c.exportValue)
      .map((c) => ({
        header: c.exportHeader ?? c.header,
        value: c.exportValue!,
        width: 18,
      }));
    if (!exportCols.length) return;
    exportXlsx({ filename: exportName, rows: sorted, columns: exportCols });
  };

  const hasToolbar = !!exportName || !!toolbar;

  return (
    <div className={cn('flex flex-col', className)}>
      {hasToolbar && (
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-(--color-border-soft)">
          <div className="text-[12px] text-(--color-muted-fg)">{toolbar}</div>
          {exportName && (
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download size={13} />
              Excel
            </Button>
          )}
        </div>
      )}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-[14px]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {visibleColumns.map((c) => (
              <col key={c.key} style={{ width: widths[c.key] ?? c.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-(--color-border-soft)">
              {visibleColumns.map((c, i) => {
                const isLast = i === visibleColumns.length - 1;
                return (
                  <th
                    key={c.key}
                    className={cn(
                      'group relative px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-(--color-muted-fg) whitespace-nowrap overflow-hidden',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                      c.align !== 'right' && c.align !== 'center' && 'text-left',
                      c.sortAccessor && 'cursor-pointer select-none hover:text-(--color-fg)',
                    )}
                    onClick={() => {
                      if (!c.sortAccessor || resizingRef.current) return;
                      setSort((prev) => {
                        if (!prev || prev.key !== c.key) return { key: c.key, dir: 'desc' };
                        return { key: c.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
                      });
                    }}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        c.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      {c.header}
                      {c.help && <InfoHint text={c.help} />}
                      {c.sortAccessor &&
                        (sort?.key === c.key ? (
                          sort.dir === 'asc' ? (
                            <ArrowUp size={11} strokeWidth={2.5} className="text-(--color-primary)" />
                          ) : (
                            <ArrowDown size={11} strokeWidth={2.5} className="text-(--color-primary)" />
                          )
                        ) : (
                          <ArrowUpDown size={11} strokeWidth={2} className="opacity-30" />
                        ))}
                    </span>
                    {!isLast && (
                      <span
                        onPointerDown={(e) => onResizeStart(e, c.key)}
                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group-hover:bg-(--color-primary)/20 active:bg-(--color-primary)/50 transition-colors"
                        title="Перетащите для изменения ширины"
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={rowKey(row, page * pageSize + i)}
                className="border-b border-(--color-border-soft) last:border-b-0 hover:bg-(--color-muted)/50 transition-colors"
              >
                {visibleColumns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-4 py-3.5 num text-(--color-fg) overflow-hidden text-ellipsis',
                      c.align === 'right' && 'text-right',
                      c.align === 'center' && 'text-center',
                    )}
                  >
                    {c.render(row, i)}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-12 text-center text-(--color-muted-fg)"
                >
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border-soft) px-6 py-3 text-[12px] text-(--color-muted-fg)">
          <div>
            {firstRowOnPage}–{lastRowOnPage} из {totalRows}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="rounded-md px-2 py-1 text-[12px] font-semibold hover:bg-(--color-muted) disabled:opacity-30 disabled:hover:bg-transparent"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-md border border-(--color-border) bg-(--color-card) px-2 py-1 text-[12px] font-medium hover:bg-(--color-muted) disabled:opacity-40 disabled:hover:bg-(--color-card)"
            >
              <ChevronLeft size={13} /> Назад
            </button>
            <span className="px-2 font-medium text-(--color-fg) tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-md border border-(--color-border) bg-(--color-card) px-2 py-1 text-[12px] font-medium hover:bg-(--color-muted) disabled:opacity-40 disabled:hover:bg-(--color-card)"
            >
              Вперёд <ChevronRight size={13} />
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="rounded-md px-2 py-1 text-[12px] font-semibold hover:bg-(--color-muted) disabled:opacity-30 disabled:hover:bg-transparent"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
