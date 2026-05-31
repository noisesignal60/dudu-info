"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { LedgerEntry, LedgerSortKey } from "@/data/reports/ledger";
import type { Department } from "@/data/reports/departments";
import { softDeleteLedgerEntriesAction } from "@/actions/reports-ledger";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Alert } from "@/ui/alert";
import { EmptyState } from "@/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";
import { LedgerEntryModal } from "./ledger-modal";

type SortField = "date" | "department" | "car" | "income" | "expense";

export function LedgerTable({
  rows,
  departments,
  basePath,
  currentSort,
  editable = true,
}: {
  rows: LedgerEntry[];
  departments: Department[];
  basePath: string; // e.g. "/reports" or "/reports/daily"
  currentSort: LedgerSortKey;
  editable?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<LedgerEntry | null>(null);
  const [pending, start] = useTransition();

  function toggleAll() {
    if (selected.size === rows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  }
  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function onBatchDelete() {
    if (selected.size === 0) return;
    if (!window.confirm(`確定刪除選取的 ${selected.size} 筆記錄？`)) return;
    start(async () => {
      const res = await softDeleteLedgerEntriesAction(Array.from(selected));
      if (!res.ok) {
        alert(res.error ?? "刪除失敗");
        return;
      }
      setSelected(new Set());
    });
  }

  function onDeleteOne(id: string) {
    if (!window.confirm("確定刪除這筆記錄？")) return;
    start(async () => {
      const res = await softDeleteLedgerEntriesAction([id]);
      if (!res.ok) alert(res.error ?? "刪除失敗");
    });
  }

  if (rows.length === 0) {
    return (
      <div className="bg-surface rounded-card border border-hairline">
        <EmptyState
          title="沒有符合條件的記錄"
          description="調整篩選條件或新增記錄"
        />
      </div>
    );
  }

  return (
    <>
      {editable && selected.size > 0 && (
        <Alert
          variant="warning"
          className="items-center justify-between py-2.5"
        >
          <span className="font-medium">已選 {selected.size} 筆</span>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onBatchDelete}
            disabled={pending}
          >
            <Trash2 />
            批量刪除 ({selected.size})
          </Button>
        </Alert>
      )}

      {/* 桌機表格 */}
      <div className="hidden md:block rounded-card border border-hairline overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {editable && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === rows.length && rows.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-brand"
                    aria-label="全選"
                  />
                </TableHead>
              )}
              <SortableTh
                field="date"
                label="日期"
                basePath={basePath}
                current={currentSort}
              />
              <SortableTh
                field="department"
                label="部門名稱"
                basePath={basePath}
                current={currentSort}
              />
              <SortableTh
                field="car"
                label="車號/人名"
                basePath={basePath}
                current={currentSort}
              />
              <TableHead>項目</TableHead>
              <SortableTh
                field="income"
                label="收入"
                basePath={basePath}
                current={currentSort}
              />
              <SortableTh
                field="expense"
                label="支出"
                basePath={basePath}
                current={currentSort}
              />
              <TableHead>備註1</TableHead>
              <TableHead>備註2</TableHead>
              {editable && <TableHead>操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                {editable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                      className="w-4 h-4 accent-brand"
                      aria-label="選擇此列"
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{r.entryDate}</TableCell>
                <TableCell className="font-medium text-slate-700">
                  {r.departmentName ?? "—"}
                </TableCell>
                <TableCell>{r.carOrPerson ?? "—"}</TableCell>
                <TableCell>{r.item}</TableCell>
                <TableCell className="text-right font-bold text-positive tabular-nums">
                  {r.income > 0 ? formatCurrency(r.income) : "—"}
                </TableCell>
                <TableCell className="text-right font-bold text-money tabular-nums">
                  {r.expense > 0 ? formatCurrency(r.expense) : "—"}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-slate-600">
                  {r.note1 ?? "—"}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-slate-600">
                  {r.note2 ?? "—"}
                </TableCell>
                {editable && (
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(r)}
                      className="text-brand-dark hover:text-brand"
                    >
                      編輯
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteOne(r.id)}
                      disabled={pending}
                      className="text-money hover:text-money"
                    >
                      刪除
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 手機卡片 */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <article
            key={r.id}
            className="bg-surface rounded-card border border-hairline shadow-premium-sm p-4 space-y-2"
          >
            <header className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{r.item}</p>
                <p className="text-xs text-slate-500">
                  {r.entryDate} ・ {r.departmentName ?? "—"}
                </p>
              </div>
              {editable && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(r)}
                    className="text-brand-dark"
                    aria-label="編輯"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteOne(r.id)}
                    className="text-money"
                    aria-label="刪除"
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </header>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Mob label="車號/人名" value={r.carOrPerson ?? "—"} />
              <Mob
                label="收入"
                value={r.income > 0 ? formatCurrency(r.income) : "—"}
                tone={r.income > 0 ? "positive" : undefined}
              />
              <Mob
                label="支出"
                value={r.expense > 0 ? formatCurrency(r.expense) : "—"}
                tone={r.expense > 0 ? "negative" : undefined}
              />
            </dl>
            {(r.note1 || r.note2) && (
              <p className="text-xs text-slate-500 border-t border-hairline pt-2">
                {[r.note1, r.note2].filter(Boolean).join(" / ")}
              </p>
            )}
          </article>
        ))}
      </div>

      {editable && (
        <LedgerEntryModal
          key={editing?.id ?? "none"}
          entry={editing ?? undefined}
          departments={departments}
          open={editing !== null}
          setOpen={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </>
  );
}

function Mob({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const color =
    tone === "positive"
      ? "text-positive font-bold"
      : tone === "negative"
        ? "text-money font-bold"
        : "text-slate-700";
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-sm ${color}`}>{value}</dd>
    </div>
  );
}

function SortableTh({
  field,
  label,
  basePath,
  current,
}: {
  field: SortField;
  label: string;
  basePath: string;
  current: LedgerSortKey;
}) {
  const ascKey = `${field}.asc` as LedgerSortKey;
  const descKey = `${field}.desc` as LedgerSortKey;
  const isAsc = current === ascKey;
  const isDesc = current === descKey;
  const nextSort = isDesc ? ascKey : descKey;

  return (
    <TableHead>
      <Link
        href={`${basePath}?sort=${nextSort}`}
        className="inline-flex items-center gap-1 hover:text-slate-900"
        aria-label={`依${label}排序，目前${isAsc ? "升冪" : isDesc ? "降冪" : "未排序"}`}
      >
        {label}
        {isAsc ? (
          <ChevronUp className="size-3.5" />
        ) : isDesc ? (
          <ChevronDown className="size-3.5" />
        ) : null}
      </Link>
    </TableHead>
  );
}
