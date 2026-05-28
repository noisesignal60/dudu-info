"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  Plus,
  Save,
  Undo2,
  Redo2,
  Trash2,
  RotateCcw,
} from "lucide-react";
import {
  createLedgerBatchAction,
  type BatchRow,
} from "@/actions/reports-ledger";
import type { Department } from "@/data/reports/departments";

type Row = {
  key: string;
  entryDate: string;
  departmentId: string;
  carOrPerson: string;
  item: string;
  income: string;
  expense: string;
  note1: string;
  note2: string;
};

const STORAGE_KEY = "dudu.reports.new.draft.v1";
const MAX_HISTORY = 30;

type HistoryState = {
  past: Row[][];
  present: Row[];
  future: Row[][];
};

type Act =
  | { type: "set"; rows: Row[] }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "load"; rows: Row[] };

function reducer(s: HistoryState, a: Act): HistoryState {
  if (a.type === "set") {
    return {
      past: [...s.past, s.present].slice(-MAX_HISTORY),
      present: a.rows,
      future: [],
    };
  }
  if (a.type === "undo") {
    if (s.past.length === 0) return s;
    const prev = s.past[s.past.length - 1];
    return {
      past: s.past.slice(0, -1),
      present: prev,
      future: [s.present, ...s.future],
    };
  }
  if (a.type === "redo") {
    if (s.future.length === 0) return s;
    const next = s.future[0];
    return {
      past: [...s.past, s.present],
      present: next,
      future: s.future.slice(1),
    };
  }
  if (a.type === "load") {
    return { past: [], present: a.rows, future: [] };
  }
  return s;
}

function makeRow(initial?: Partial<Row>): Row {
  return {
    key: Math.random().toString(36).slice(2),
    entryDate: initial?.entryDate ?? new Date().toISOString().slice(0, 10),
    departmentId: initial?.departmentId ?? "",
    carOrPerson: initial?.carOrPerson ?? "",
    item: initial?.item ?? "",
    income: initial?.income ?? "",
    expense: initial?.expense ?? "",
    note1: initial?.note1 ?? "",
    note2: initial?.note2 ?? "",
  };
}

export function BatchEntryForm({
  departments,
}: {
  departments: Department[];
}) {
  const initial = useMemo(
    () => ({ past: [], present: [makeRow()], future: [] }) as HistoryState,
    [],
  );
  const [state, dispatch] = useReducer(reducer, initial);
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw) as Row[];
      if (Array.isArray(arr) && arr.length > 0) {
        dispatch({ type: "load", rows: arr });
      }
    } catch {}
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.present));
    } catch {}
  }, [state.present]);

  const update = useCallback(
    (idx: number, patch: Partial<Row>) => {
      const next = state.present.map((r, i) =>
        i === idx ? { ...r, ...patch } : r,
      );
      dispatch({ type: "set", rows: next });
    },
    [state.present],
  );

  const addRow = useCallback(() => {
    const lastDate =
      state.present[state.present.length - 1]?.entryDate ??
      new Date().toISOString().slice(0, 10);
    const lastDept = state.present[state.present.length - 1]?.departmentId ?? "";
    dispatch({
      type: "set",
      rows: [
        ...state.present,
        makeRow({ entryDate: lastDate, departmentId: lastDept }),
      ],
    });
  }, [state.present]);

  const removeRow = useCallback(
    (idx: number) => {
      const next = state.present.filter((_, i) => i !== idx);
      dispatch({ type: "set", rows: next.length === 0 ? [makeRow()] : next });
    },
    [state.present],
  );

  const reset = useCallback(() => {
    if (!window.confirm("確定清除所有暫存？此動作會清空所有列。")) return;
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "load", rows: [makeRow()] });
  }, []);

  async function onSubmit() {
    // 過濾掉完全空白的列
    const nonEmpty = state.present.filter(
      (r) =>
        r.item.trim() ||
        r.carOrPerson.trim() ||
        Number(r.income) > 0 ||
        Number(r.expense) > 0,
    );
    if (nonEmpty.length === 0) {
      setFlash({ ok: false, msg: "沒有可送出的記錄" });
      return;
    }

    // 必填檢查
    for (const r of nonEmpty) {
      if (!r.entryDate) {
        setFlash({ ok: false, msg: "有列缺少日期" });
        return;
      }
      if (!r.departmentId) {
        setFlash({ ok: false, msg: "有列未選部門" });
        return;
      }
      if (!r.item.trim()) {
        setFlash({ ok: false, msg: "有列未填項目" });
        return;
      }
    }

    const payload: BatchRow[] = nonEmpty.map((r) => ({
      entryDate: r.entryDate,
      departmentId: r.departmentId,
      carOrPerson: r.carOrPerson || undefined,
      item: r.item,
      income: Number(r.income) || 0,
      expense: Number(r.expense) || 0,
      note1: r.note1 || undefined,
      note2: r.note2 || undefined,
    }));

    setPending(true);
    setFlash(null);
    const res = await createLedgerBatchAction(payload);
    setPending(false);

    if (!res.ok) {
      setFlash({ ok: false, msg: res.error });
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "load", rows: [makeRow()] });
    setFlash({ ok: true, msg: `已新增 ${res.inserted} 筆記錄` });
  }

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return (
    <div className="space-y-4">
      {/* 工具列 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "undo" })}
          disabled={!canUndo}
          className="btn-secondary !min-h-10 !text-sm disabled:opacity-40"
        >
          <Undo2 className="w-4 h-4" />
          復原
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "redo" })}
          disabled={!canRedo}
          className="btn-secondary !min-h-10 !text-sm disabled:opacity-40"
        >
          <Redo2 className="w-4 h-4" />
          重做
        </button>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <button
          type="button"
          onClick={addRow}
          className="btn-secondary !min-h-10 !text-sm"
        >
          <Plus className="w-4 h-4" />
          新增一列
        </button>
        <button
          type="button"
          onClick={reset}
          className="btn-secondary !min-h-10 !text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          清除暫存
        </button>
        <div className="ml-auto inline-flex items-center gap-3">
          {flash && (
            <span
              className={`text-sm font-medium ${
                flash.ok ? "text-green-700" : "text-red-600"
              }`}
            >
              {flash.msg}
            </span>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="btn-primary !min-h-10 !text-sm"
          >
            <Save className="w-4 h-4" />
            {pending ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>

      <p className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-xl">
        提示：收入請填正數，支出請填正數。系統自動以欄位區分。所有變更會自動暫存到本機。
      </p>

      {/* 多列輸入 */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <Th className="w-10">#</Th>
                <Th>日期 *</Th>
                <Th>部門名稱 *</Th>
                <Th>車號/人名</Th>
                <Th>項目 *</Th>
                <Th align="right">收入</Th>
                <Th align="right">支出</Th>
                <Th>備註1</Th>
                <Th>備註2</Th>
                <Th align="right">操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.present.map((row, idx) => (
                <tr key={row.key} className="hover:bg-slate-50/50">
                  <Td className="text-slate-400 text-xs">{idx + 1}</Td>
                  <Td className="!p-1.5">
                    <input
                      type="date"
                      value={row.entryDate}
                      onChange={(e) =>
                        update(idx, { entryDate: e.target.value })
                      }
                      className="input-base !min-h-9 !text-sm !w-36"
                    />
                  </Td>
                  <Td className="!p-1.5">
                    <select
                      value={row.departmentId}
                      onChange={(e) =>
                        update(idx, { departmentId: e.target.value })
                      }
                      className="input-base !min-h-9 !text-sm !w-32"
                    >
                      <option value="">請選擇</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td className="!p-1.5">
                    <input
                      type="text"
                      value={row.carOrPerson}
                      onChange={(e) =>
                        update(idx, { carOrPerson: e.target.value })
                      }
                      className="input-base !min-h-9 !text-sm !w-32"
                    />
                  </Td>
                  <Td className="!p-1.5">
                    <input
                      type="text"
                      value={row.item}
                      onChange={(e) => update(idx, { item: e.target.value })}
                      className="input-base !min-h-9 !text-sm !w-32"
                    />
                  </Td>
                  <Td className="!p-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={row.income}
                      onChange={(e) => update(idx, { income: e.target.value })}
                      className="input-base !min-h-9 !text-sm !w-24 text-right text-positive font-bold"
                      placeholder="0"
                    />
                  </Td>
                  <Td className="!p-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={row.expense}
                      onChange={(e) =>
                        update(idx, { expense: e.target.value })
                      }
                      className="input-base !min-h-9 !text-sm !w-24 text-right text-money font-bold"
                      placeholder="0"
                    />
                  </Td>
                  <Td className="!p-1.5">
                    <input
                      type="text"
                      value={row.note1}
                      onChange={(e) => update(idx, { note1: e.target.value })}
                      className="input-base !min-h-9 !text-sm !w-32"
                    />
                  </Td>
                  <Td className="!p-1.5">
                    <input
                      type="text"
                      value={row.note2}
                      onChange={(e) => update(idx, { note2: e.target.value })}
                      className="input-base !min-h-9 !text-sm !w-32"
                    />
                  </Td>
                  <Td align="right" className="!p-1.5">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-red-600 hover:text-red-700 p-1.5"
                      aria-label="移除此列"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        共 <strong>{state.present.length}</strong> 列 · 復原棧 {state.past.length}{" "}
        / 重做棧 {state.future.length}
      </div>
    </div>
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
      className={`px-3 py-3 text-xs font-bold uppercase whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
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
      className={`px-3 py-2.5 ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </td>
  );
}
