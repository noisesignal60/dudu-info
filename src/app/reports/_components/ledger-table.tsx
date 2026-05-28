"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import type { LedgerEntry, LedgerSortKey } from "@/data/reports/ledger";
import type { Department } from "@/data/reports/departments";
import { softDeleteLedgerEntriesAction } from "@/actions/reports-ledger";
import { formatCurrency, cn } from "@/lib/utils";
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
      <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-500">
        <p>沒有符合條件的記錄</p>
        <p className="text-sm mt-1">調整篩選條件或新增記錄</p>
      </div>
    );
  }

  return (
    <>
      {editable && selected.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-900">
            已選 {selected.size} 筆
          </span>
          <button
            type="button"
            onClick={onBatchDelete}
            disabled={pending}
            className="btn-danger !min-h-9 !text-sm"
          >
            <Trash2 className="w-4 h-4" />
            批量刪除 ({selected.size})
          </button>
        </div>
      )}

      {/* 桌機表格 */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                {editable && (
                  <Th className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === rows.length && rows.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-brand"
                      aria-label="全選"
                    />
                  </Th>
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
                <Th>項目</Th>
                <SortableTh
                  field="income"
                  label="收入"
                  basePath={basePath}
                  current={currentSort}
                  align="right"
                />
                <SortableTh
                  field="expense"
                  label="支出"
                  basePath={basePath}
                  current={currentSort}
                  align="right"
                />
                <Th>備註1</Th>
                <Th>備註2</Th>
                {editable && <Th align="right">操作</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={cn(
                    "hover:bg-slate-50",
                    i % 2 === 1 && "bg-slate-50/50",
                  )}
                >
                  {editable && (
                    <Td>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="w-4 h-4 accent-brand"
                        aria-label="選擇此列"
                      />
                    </Td>
                  )}
                  <Td className="whitespace-nowrap font-medium">
                    {r.entryDate}
                  </Td>
                  <Td className="font-medium text-slate-700">
                    {r.departmentName ?? "—"}
                  </Td>
                  <Td>{r.carOrPerson ?? "—"}</Td>
                  <Td>{r.item}</Td>
                  <Td
                    align="right"
                    className="font-bold text-positive tabular-nums"
                  >
                    {r.income > 0 ? formatCurrency(r.income) : "—"}
                  </Td>
                  <Td
                    align="right"
                    className="font-bold text-money tabular-nums"
                  >
                    {r.expense > 0 ? formatCurrency(r.expense) : "—"}
                  </Td>
                  <Td className="max-w-[160px] truncate text-slate-600">
                    {r.note1 ?? "—"}
                  </Td>
                  <Td className="max-w-[160px] truncate text-slate-600">
                    {r.note2 ?? "—"}
                  </Td>
                  {editable && (
                    <Td align="right" className="whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="inline-flex items-center gap-1 text-brand-dark hover:text-brand font-semibold mr-3"
                      >
                        <Pencil className="w-4 h-4" />
                        編輯
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteOne(r.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        刪除
                      </button>
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 手機卡片 */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => (
          <article
            key={r.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2"
          >
            <header className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{r.item}</p>
                <p className="text-xs text-slate-500">
                  {r.entryDate} ・ {r.departmentName ?? "—"}
                </p>
              </div>
              {editable && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="text-brand-dark"
                    aria-label="編輯"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteOne(r.id)}
                    className="text-red-600"
                    aria-label="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
                {[r.note1, r.note2].filter(Boolean).join(" / ")}
              </p>
            )}
          </article>
        ))}
      </div>

      {editing && (
        <LedgerEntryModal
          entry={editing}
          departments={departments}
          onClose={() => setEditing(null)}
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
  align = "left",
}: {
  field: SortField;
  label: string;
  basePath: string;
  current: LedgerSortKey;
  align?: "left" | "right";
}) {
  const ascKey = `${field}.asc` as LedgerSortKey;
  const descKey = `${field}.desc` as LedgerSortKey;
  const isAsc = current === ascKey;
  const isDesc = current === descKey;
  const nextSort = isDesc ? ascKey : descKey;

  return (
    <th
      className={cn(
        "px-3 py-3 text-xs font-bold uppercase whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <Link
        href={`${basePath}?sort=${nextSort}`}
        className="inline-flex items-center gap-1 hover:text-slate-900"
      >
        {label}
        {isAsc ? (
          <ArrowUp className="w-3 h-3" />
        ) : isDesc ? (
          <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </Link>
    </th>
  );
}

function Th({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-xs font-bold uppercase whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td
      className={cn(
        "px-3 py-2.5",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  );
}
