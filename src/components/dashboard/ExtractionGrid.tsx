'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellKeyDownEvent,
  type ColDef,
  type GridReadyEvent,
  type ICellRendererParams,
  type SuppressKeyboardEventParams,
  type ValueSetterParams,
} from 'ag-grid-community';
import * as XLSX from 'xlsx';
import { Trash2, Download, Search, TableProperties } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteExtractionRow, updateExtractionField, type ExtractionRow } from '@/lib/api';
import { toast } from 'sonner';

ModuleRegistry.registerModules([AllCommunityModule]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(secs: number | null): string {
  if (secs == null) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

function ConfidenceBadge({ value }: ICellRendererParams) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const styles: Record<string, string> = {
    high:    'bg-[rgba(134,239,172,0.12)] text-[#86EFAC] border border-[rgba(134,239,172,0.25)]',
    partial: 'bg-[rgba(252,211,77,0.12)] text-[#FCD34D] border border-[rgba(252,211,77,0.25)]',
    low:     'bg-[rgba(252,165,165,0.12)] text-[#FCA5A5] border border-[rgba(252,165,165,0.25)]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono ${styles[value] ?? ''}`}>
      {value}
    </span>
  );
}

function PhoneCell({ value, data, context }: ICellRendererParams) {
  return (
    <button
      className="font-mono text-[12px] text-[#93C5FD] hover:text-white underline-offset-2 hover:underline transition-colors"
      onClick={() => context?.router?.push(`/dashboard/calls/${data.call_id}`)}
    >
      {value || '—'}
    </button>
  );
}

function NullableCell({ value }: ICellRendererParams) {
  if (value == null || value === '') {
    return <span className="text-[#52525B] italic text-[11px]">null</span>;
  }
  return <span className="text-[#E4E4E7] text-[13px]">{String(value)}</span>;
}

function MissingCountCell({ value }: ICellRendererParams) {
  if (value == null) return <span className="text-[#52525B]">—</span>;
  return (
    <span className={`font-mono text-[12px] ${value === 0 ? 'text-[#86EFAC]' : 'text-[#FCD34D]'}`}>
      {value}
    </span>
  );
}

function DeleteCell({ data, context }: ICellRendererParams) {
  return (
    <button
      onClick={() => context?.onDeleteRow?.(data.call_id)}
      className="flex items-center justify-center size-full text-[#52525B] hover:text-[#FCA5A5] transition-colors"
      title="Delete row"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ExtractionGridProps {
  extractionColumns: string[];
  rows: ExtractionRow[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExtractionGrid({ extractionColumns, rows }: ExtractionGridProps) {
  const router = useRouter();
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [rowData, setRowData] = useState<ExtractionRow[]>(rows);

  useEffect(() => { setRowData(rows); }, [rows]);

  const handleDeleteRow = useCallback(async (callId: string) => {
    if (!confirm('Delete this extraction record?')) return;
    const ok = await deleteExtractionRow(callId);
    if (ok) {
      setRowData(prev => prev.filter(r => r.call_id !== callId));
      toast.success('Extraction record deleted');
    } else {
      toast.error('Failed to delete record');
    }
  }, []);

  // Fixed meta columns
  const metaColDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Phone',
      field: 'phone',
      pinned: 'left',
      width: 160,
      cellRenderer: PhoneCell,
      filter: 'agTextColumnFilter',
      editable: false,
    },
    {
      headerName: 'Date',
      field: 'started_at',
      width: 170,
      valueFormatter: (p: { value: string | null }) => formatDate(p.value),
      filter: 'agDateColumnFilter',
      sort: 'desc',
      editable: false,
    },
    {
      headerName: 'Duration',
      field: 'duration_seconds',
      width: 110,
      valueFormatter: (p: { value: number | null }) => formatDuration(p.value),
      filter: 'agNumberColumnFilter',
      editable: false,
    },
    {
      headerName: 'Confidence',
      field: 'confidence',
      width: 120,
      cellRenderer: ConfidenceBadge,
      filter: 'agTextColumnFilter',
      editable: false,
    },
    {
      headerName: 'Missing',
      field: 'missing_count',
      width: 90,
      cellRenderer: MissingCountCell,
      filter: 'agNumberColumnFilter',
      headerTooltip: 'Number of fields not extracted',
      editable: false,
    },
  ], []);

  // Dynamic extraction columns — AG Grid built-in text editor + valueSetter
  const dynamicColDefs: ColDef[] = useMemo(() =>
    extractionColumns.map(field => ({
      headerName: toTitleCase(field),
      field,
      minWidth: 130,
      flex: 1,
      editable: true,
      cellRenderer: NullableCell,
      filter: 'agTextColumnFilter',
      tooltipField: field,
      // Arrow keys move cursor inside text box, not navigate cells
      suppressKeyboardEvent: (params: SuppressKeyboardEventParams) => {
        if (params.editing) {
          const k = params.event.key;
          return k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Home' || k === 'End';
        }
        return false;
      },
      // valueSetter is called by AG Grid after editing — no forwardRef/useImperativeHandle needed
      valueSetter: (params: ValueSetterParams) => {
        const newVal = params.newValue ?? '';
        const oldVal = params.oldValue ?? '';
        if (newVal === oldVal) return false;
        // Update the row data reference so AG Grid shows new value immediately
        params.data[field] = newVal;
        // Persist to DB (async)
        updateExtractionField(params.data.call_id, field, newVal).then(ok => {
          if (ok) {
            setRowData(prev => prev.map(r =>
              r.call_id === params.data.call_id ? { ...r, [field]: newVal } : r
            ));
            toast.success('Value updated');
          } else {
            toast.error('Failed to update value');
            params.node?.setDataValue(field, oldVal);
          }
        });
        return true;
      },
    })),
  [extractionColumns]);

  // Delete column
  const deleteColDef: ColDef = useMemo(() => ({
    headerName: '',
    field: '_delete',
    width: 48,
    pinned: 'right' as const,
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
    editable: false,
    cellRenderer: DeleteCell,
  }), []);

  const columnDefs = useMemo(
    () => [...metaColDefs, ...dynamicColDefs, deleteColDef],
    [metaColDefs, dynamicColDefs, deleteColDef],
  );

  const defaultColDef: ColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    suppressMovable: false,
    minWidth: 80,
  }), []);

  const onGridReady = useCallback((e: GridReadyEvent) => {
    e.api.sizeColumnsToFit();
  }, []);

  const exportToExcel = useCallback(() => {
    if (!gridRef.current?.api) return;
    const visibleRows: Record<string, unknown>[] = [];
    gridRef.current.api.forEachNodeAfterFilterAndSort(node => {
      if (node.data) visibleRows.push(node.data);
    });
    const headers = [
      'Phone', 'Started At', 'Duration (s)', 'Confidence', 'Missing Fields',
      ...extractionColumns.map(toTitleCase),
    ];
    const fieldOrder = [
      'phone', 'started_at', 'duration_seconds', 'confidence', 'missing_count',
      ...extractionColumns,
    ];
    const sheetData = [
      headers,
      ...visibleRows.map(row =>
        fieldOrder.map(f => {
          const v = row[f];
          if (f === 'started_at' && v) return formatDate(v as string);
          return v ?? '';
        })
      ),
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');
    XLSX.writeFile(wb, `extraction_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [extractionColumns]);

  if (rowData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <TableProperties className="size-7 opacity-25" />
        <p className="text-sm">No extracted data yet for this agent.</p>
        <p className="text-xs text-muted-foreground/60">
          Calls will appear here after extraction runs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search all fields…"
            value={quickFilter}
            onChange={e => setQuickFilter(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            {rowData.length} row{rowData.length !== 1 ? 's' : ''}
          </span>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={exportToExcel}>
            <Download className="size-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* AG Grid */}
      <div
        className="ag-theme-extraction"
        style={{ height: Math.min(600, 48 + rowData.length * 42 + 56), width: '100%' }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilter}
          pagination
          paginationPageSize={25}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          onGridReady={onGridReady}
          onCellKeyDown={(params: CellKeyDownEvent) => {
            const event = params.event as KeyboardEvent | undefined;
            if (event?.key !== 'Enter') return;
            const colDef = params.column.getColDef();
            if (!colDef.editable) return;
            const alreadyEditing = params.api.getEditingCells().some(
              c => c.rowIndex === params.rowIndex && c.column?.getColId() === params.column.getColId()
            );
            if (!alreadyEditing) {
              params.api.startEditingCell({ rowIndex: params.rowIndex!, colKey: params.column.getColId() });
            }
          }}
          context={{ router, onDeleteRow: handleDeleteRow }}
          rowHeight={42}
          headerHeight={40}
          tooltipShowDelay={400}
          animateRows={false}
          stopEditingWhenCellsLoseFocus
          singleClickEdit={false}
        />
      </div>

      {/* AG Grid dark theme */}
      <style>{`
        .ag-theme-extraction {
          --ag-background-color: transparent;
          --ag-foreground-color: #E4E4E7;
          --ag-header-background-color: #111114;
          --ag-header-foreground-color: #71717A;
          --ag-odd-row-background-color: rgba(255,255,255,0.01);
          --ag-row-hover-color: rgba(255,255,255,0.03);
          --ag-border-color: rgba(255,255,255,0.08);
          --ag-row-border-color: rgba(255,255,255,0.05);
          --ag-cell-horizontal-border: none;
          --ag-font-size: 13px;
          --ag-font-family: var(--font-geist-sans), system-ui, sans-serif;
          --ag-header-column-separator-color: rgba(255,255,255,0.08);
          --ag-selected-row-background-color: rgba(0,229,160,0.06);
          --ag-range-selection-border-color: #00E5A0;
          --ag-input-focus-border-color: rgba(255,255,255,0.22);
          --ag-checkbox-checked-color: #00E5A0;
          --ag-icon-size: 14px;
          --ag-widget-container-horizontal-padding: 12px;
          --ag-widget-container-vertical-padding: 8px;
          --ag-popup-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
          --ag-menu-background-color: #16161A;
          --ag-control-panel-background-color: #111114;
          --ag-panel-background-color: #16161A;
          --ag-input-border-color: rgba(255,255,255,0.12);
          --ag-input-background-color: rgba(255,255,255,0.05);
          --ag-placeholder-color: #52525B;
          --ag-pagination-button-color: #71717A;
          --ag-pagination-button-hover-color: #E4E4E7;
          --ag-modal-overlay-background-color: rgba(10,10,11,0.7);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .ag-theme-extraction .ag-header-cell-label {
          font-family: var(--font-geist-mono, monospace);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ag-theme-extraction .ag-paging-panel {
          border-top: 1px solid rgba(255,255,255,0.06);
          color: #71717A;
          font-size: 12px;
          height: 44px;
        }

        .ag-theme-extraction .ag-cell {
          display: flex;
          align-items: center;
        }

        .ag-theme-extraction .ag-cell-focus {
          border: 1px solid rgba(0,229,160,0.4) !important;
          outline: none !important;
        }

        .ag-theme-extraction .ag-cell-inline-editing {
          border: 1px solid rgba(0,229,160,0.6) !important;
          background: rgba(0,229,160,0.04) !important;
          box-shadow: 0 0 0 2px rgba(0,229,160,0.1);
        }

        .ag-theme-extraction .ag-cell-inline-editing input {
          background: transparent !important;
          color: #E4E4E7 !important;
          font-size: 13px !important;
          border: none !important;
          outline: none !important;
          padding: 0 4px !important;
        }

        .ag-theme-extraction .ag-row {
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .ag-theme-extraction .ag-pinned-left-cols-container .ag-cell,
        .ag-theme-extraction .ag-pinned-right-cols-container .ag-cell {
          background: #0e0e11;
        }

        .ag-theme-extraction .ag-column-drop-wrapper {
          display: none;
        }
      `}</style>
    </div>
  );
}
