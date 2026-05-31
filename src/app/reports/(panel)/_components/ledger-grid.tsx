"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import {
  saveLedgerGridAction,
  type GridUpsertRow,
} from "@/actions/reports-ledger";
import type { Department } from "@/data/reports/departments";
import type { LedgerEntry } from "@/data/reports/ledger";
import {
  ROW_FIELDS,
  type RowField,
  normalizeField,
  parseClipboardTSV,
  aoaToRows,
  type GridRowInput,
} from "@/lib/ledger-import";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/ui/button";
import {
  SheetScroll,
  SheetTable,
  SheetHead,
  SheetHeadCell,
  SheetCorner,
  SheetRowNum,
  SheetCell,
  sheetActiveCls,
  sheetInvalidCls,
} from "@/ui/sheet";

const MAX_HISTORY = 30;

type ColType = "date" | "dept" | "text" | "number";
type Col = {
  field: RowField;
  label: string;
  type: ColType;
  width: number;
  right?: boolean;
};

/** 欄位設定，順序與 ROW_FIELDS 對齊（貼上/導覽共用同一欄序）。 */
const COLS: Col[] = [
  { field: "entryDate", label: "日期", type: "date", width: 132 },
  { field: "departmentName", label: "部門名稱", type: "dept", width: 120 },
  { field: "carOrPerson", label: "車號/人名", type: "text", width: 120 },
  { field: "item", label: "項目", type: "text", width: 168 },
  { field: "income", label: "收入", type: "number", width: 112, right: true },
  { field: "expense", label: "支出", type: "number", width: 112, right: true },
  { field: "note1", label: "備註1", type: "text", width: 132 },
  { field: "note2", label: "備註2", type: "text", width: 132 },
];

type Row = {
  key: string;
  id?: string; // 既有 DB 列才有；新列為 undefined
  entryDate: string;
  departmentName: string;
  carOrPerson: string;
  item: string;
  income: string;
  expense: string;
  note1: string;
  note2: string;
};

type Norm = {
  entryDate: string;
  departmentId: string;
  carOrPerson: string;
  item: string;
  income: number;
  expense: number;
  note1: string;
  note2: string;
};

type HistoryState = { past: Row[][]; present: Row[]; future: Row[][] };
type Act =
  | { type: "set"; rows: Row[] }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "load"; rows: Row[] };

function reducer(s: HistoryState, a: Act): HistoryState {
  switch (a.type) {
    case "set":
      return {
        past: [...s.past, s.present].slice(-MAX_HISTORY),
        present: a.rows,
        future: [],
      };
    case "undo":
      if (s.past.length === 0) return s;
      return {
        past: s.past.slice(0, -1),
        present: s.past[s.past.length - 1],
        future: [s.present, ...s.future],
      };
    case "redo":
      if (s.future.length === 0) return s;
      return {
        past: [...s.past, s.present],
        present: s.future[0],
        future: s.future.slice(1),
      };
    case "load":
      return { past: [], present: a.rows, future: [] };
    default:
      return s;
  }
}

function randKey() {
  return Math.random().toString(36).slice(2);
}

function makeRow(initial?: Partial<Row>): Row {
  return {
    key: randKey(),
    entryDate: initial?.entryDate ?? new Date().toISOString().slice(0, 10),
    departmentName: initial?.departmentName ?? "",
    carOrPerson: initial?.carOrPerson ?? "",
    item: initial?.item ?? "",
    income: initial?.income ?? "",
    expense: initial?.expense ?? "",
    note1: initial?.note1 ?? "",
    note2: initial?.note2 ?? "",
  };
}

function entryToRow(e: LedgerEntry): Row {
  return {
    key: e.id,
    id: e.id,
    entryDate: e.entryDate,
    departmentName: e.departmentName ?? "",
    carOrPerson: e.carOrPerson ?? "",
    item: e.item,
    income: e.income ? String(e.income) : "",
    expense: e.expense ? String(e.expense) : "",
    note1: e.note1 ?? "",
    note2: e.note2 ?? "",
  };
}

function inputToRow(g: GridRowInput): Row {
  return makeRow({
    entryDate: g.entryDate,
    departmentName: g.departmentName,
    carOrPerson: g.carOrPerson,
    item: g.item,
    income: g.income,
    expense: g.expense,
    note1: g.note1,
    note2: g.note2,
  });
}

function toRows(entries: LedgerEntry[]): Row[] {
  return entries.map(entryToRow);
}

function buildBaseline(entries: LedgerEntry[]): Map<string, Norm> {
  const m = new Map<string, Norm>();
  for (const e of entries) {
    m.set(e.id, {
      entryDate: e.entryDate,
      departmentId: e.departmentId,
      carOrPerson: e.carOrPerson ?? "",
      item: e.item,
      income: e.income,
      expense: e.expense,
      note1: e.note1 ?? "",
      note2: e.note2 ?? "",
    });
  }
  return m;
}

function num(s: string): number {
  return Number(s) || 0;
}

/** 列是否有實質內容（部門名稱單獨存在不算）。 */
function isMeaningful(r: Row): boolean {
  return Boolean(
    r.item.trim() ||
      r.carOrPerson.trim() ||
      num(r.income) > 0 ||
      num(r.expense) > 0 ||
      r.note1.trim() ||
      r.note2.trim(),
  );
}

function normOf(r: Row, deptId: string): Norm {
  return {
    entryDate: r.entryDate,
    departmentId: deptId,
    carOrPerson: r.carOrPerson.trim(),
    item: r.item.trim(),
    income: num(r.income),
    expense: num(r.expense),
    note1: r.note1.trim(),
    note2: r.note2.trim(),
  };
}

function sameNorm(a: Norm, b: Norm): boolean {
  return (
    a.entryDate === b.entryDate &&
    a.departmentId === b.departmentId &&
    a.carOrPerson === b.carOrPerson &&
    a.item === b.item &&
    a.income === b.income &&
    a.expense === b.expense &&
    a.note1 === b.note1 &&
    a.note2 === b.note2
  );
}

type Problem = "date" | "deptEmpty" | "deptUnmatched" | "item" | null;

function isCellInvalid(problem: Problem, field: RowField): boolean {
  if (!problem) return false;
  if (field === "entryDate") return problem === "date";
  if (field === "departmentName")
    return problem === "deptEmpty" || problem === "deptUnmatched";
  if (field === "item") return problem === "item";
  return false;
}

export function LedgerGrid({
  initialRows,
  departments,
}: {
  initialRows: LedgerEntry[];
  departments: Department[];
}) {
  const router = useRouter();

  const nameToId = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.name.trim(), d.id);
    return m;
  }, [departments]);

  /** 名稱 → 部門 id：空字串回 ""，查無回 null（＝對不到、要標紅）。 */
  const resolveDeptId = useCallback(
    (name: string): string | null => {
      const n = name.trim();
      if (!n) return "";
      return nameToId.get(n) ?? null;
    },
    [nameToId],
  );

  const initialState = useMemo<HistoryState>(() => {
    const rows = toRows(initialRows);
    return { past: [], present: rows.length ? rows : [makeRow()], future: [] };
    // 只在掛載時建立一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [state, dispatch] = useReducer(reducer, initialState);

  const baselineRef = useRef<Map<string, Norm>>(buildBaseline(initialRows));
  const initialRef = useRef(initialRows);

  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);

  // 試算表選取 / 編輯狀態
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editSelectAll, setEditSelectAll] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set()); // 勾選列（以 row.key 為鍵）
  const gridRef = useRef<HTMLDivElement>(null);
  const editBackupRef = useRef<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // 伺服器資料更新（儲存後 router.refresh()）時重新載入，並重建 baseline
  useEffect(() => {
    if (initialRef.current === initialRows) return;
    initialRef.current = initialRows;
    baselineRef.current = buildBaseline(initialRows);
    const rows = toRows(initialRows);
    dispatch({ type: "load", rows: rows.length ? rows : [makeRow()] });
    setActive(null);
    setEditing(false);
    setSelected(new Set());
  }, [initialRows]);

  const update = useCallback(
    (idx: number, patch: Partial<Row>) => {
      dispatch({
        type: "set",
        rows: state.present.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
      });
    },
    [state.present],
  );

  const addRow = useCallback(() => {
    const last = state.present[state.present.length - 1];
    dispatch({
      type: "set",
      rows: [
        ...state.present,
        makeRow({
          entryDate: last?.entryDate ?? new Date().toISOString().slice(0, 10),
          departmentName: last?.departmentName ?? "",
        }),
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

  const toggleOne = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === state.present.length
        ? new Set()
        : new Set(state.present.map((r) => r.key)),
    );
  }, [state.present]);

  const removeSelected = useCallback(() => {
    if (selected.size === 0) return;
    const next = state.present.filter((r) => !selected.has(r.key));
    dispatch({ type: "set", rows: next.length === 0 ? [makeRow()] : next });
    setSelected(new Set());
    setActive(null);
    setEditing(false);
  }, [selected, state.present]);

  const discard = useCallback(() => {
    if (!window.confirm("要捨棄目前所有未儲存的變更嗎？")) return;
    const rows = toRows(initialRef.current);
    dispatch({ type: "load", rows: rows.length ? rows : [makeRow()] });
    setActive(null);
    setEditing(false);
    setSelected(new Set());
    setFlash(null);
  }, []);

  // ── 試算表互動 ───────────────────────────────────────────────
  // 同步聚焦（不可用 rAF：否則點選排程的聚焦會在雙擊進入編輯後搶走焦點）
  const focusGrid = useCallback(() => {
    gridRef.current?.focus();
  }, []);

  const selectCell = useCallback(
    (r: number, c: number) => {
      setEditing(false);
      setActive({ r, c });
      focusGrid();
    },
    [focusGrid],
  );

  const enterEdit = useCallback(
    (r: number, c: number, initial?: string) => {
      const col = COLS[c];
      if (col.type === "dept") return; // 部門用下拉選取，不進入文字編輯
      editBackupRef.current = state.present[r]?.[col.field] ?? "";
      if (initial !== undefined && col.type !== "date") {
        setEditSelectAll(false);
        update(r, { [col.field]: initial });
      } else {
        setEditSelectAll(true);
      }
      setActive({ r, c });
      setEditing(true);
    },
    [state.present, update],
  );

  const moveActive = useCallback(
    (dr: number, dc: number) => {
      setActive((prev) => {
        if (!prev) return prev;
        return {
          r: Math.min(state.present.length - 1, Math.max(0, prev.r + dr)),
          c: Math.min(COLS.length - 1, Math.max(0, prev.c + dc)),
        };
      });
      focusGrid();
    },
    [state.present.length, focusGrid],
  );

  const tabMove = useCallback(
    (back: boolean) => {
      setActive((prev) => {
        if (!prev) return prev;
        const lastC = COLS.length - 1;
        const lastR = state.present.length - 1;
        let { r, c } = prev;
        if (back) {
          if (c > 0) c -= 1;
          else if (r > 0) {
            r -= 1;
            c = lastC;
          }
        } else if (c < lastC) c += 1;
        else if (r < lastR) {
          r += 1;
          c = 0;
        }
        return { r, c };
      });
      focusGrid();
    },
    [state.present.length, focusGrid],
  );

  function onGridKeyDown(e: React.KeyboardEvent) {
    if (editing) return; // 編輯中由 editor 自行處理
    if (e.ctrlKey || e.metaKey) return; // 交給 onCopy / onPaste
    if (!active) return;
    const { r, c } = active;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        moveActive(-1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        moveActive(1, 0);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveActive(0, -1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveActive(0, 1);
        break;
      case "Tab":
        e.preventDefault();
        tabMove(e.shiftKey);
        break;
      case "Enter":
      case "F2":
        e.preventDefault();
        enterEdit(r, c);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        update(r, { [COLS[c].field]: "" });
        break;
      default:
        if (e.altKey) return;
        if (e.key.length === 1) {
          e.preventDefault();
          enterEdit(r, c, e.key);
        }
    }
  }

  function onGridCopy(e: React.ClipboardEvent) {
    if (editing || !active) return;
    const row = state.present[active.r];
    if (!row) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", row[COLS[active.c].field] ?? "");
  }

  function onEditorKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      setEditing(false);
      moveActive(1, 0);
    } else if (e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      setEditing(false);
      tabMove(e.shiftKey);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (active)
        update(active.r, { [COLS[active.c].field]: editBackupRef.current });
      setEditing(false);
      focusGrid();
    }
  }

  // ── 從 Excel 貼上（剪貼簿 TSV） ──────────────────────────────
  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (editing) return; // 編輯中讓原生貼上進輸入框
      const text = e.clipboardData.getData("text");
      if (!/[\t\n\r]/u.test(text)) return; // 單格 → 原生貼上
      const matrix = parseClipboardTSV(text);
      if (matrix.length === 0 || !active) return;
      e.preventDefault();

      const startCol = active.c;
      const rows = state.present.map((r) => ({ ...r }));
      matrix.forEach((line, i) => {
        const rowIdx = active.r + i;
        while (rows.length <= rowIdx) rows.push(makeRow());
        line.forEach((raw, j) => {
          const field = ROW_FIELDS[startCol + j];
          if (!field) return;
          rows[rowIdx][field] = normalizeField(field, raw);
        });
      });
      dispatch({ type: "set", rows });
      setFlash({ ok: true, msg: `已貼上 ${matrix.length} 列，記得按儲存` });
    },
    [active, editing, state.present],
  );

  // ── 匯入 Excel / CSV ────────────────────────────────────────
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        raw: false,
        blankrows: false,
      });
      const parsed = aoaToRows(aoa as unknown[][]);
      if (parsed.length === 0) {
        setFlash({ ok: false, msg: "這個檔案讀不到資料，請確認格式" });
        return;
      }
      const imported = parsed.map(inputToRow);
      const hasData = state.present.some(isMeaningful);
      let rows: Row[];
      if (hasData) {
        const append = window.confirm(
          "目前已有資料。\n按「確定」把匯入的列附加在後面，按「取消」改成整批取代。",
        );
        rows = append
          ? [...state.present.filter(isMeaningful), ...imported]
          : imported;
      } else {
        rows = imported;
      }
      dispatch({ type: "set", rows });
      setFlash({ ok: true, msg: `已帶入 ${imported.length} 列，記得按儲存` });
    } catch (err) {
      console.error("[ledger-grid] import", err);
      setFlash({ ok: false, msg: "讀取檔案時出了點問題，請換個檔再試" });
    }
  }

  // ── 每列問題（即時內嵌驗證） ─────────────────────────────────
  const rowProblem = useCallback(
    (r: Row): Problem => {
      if (!isMeaningful(r)) return null;
      if (!r.entryDate) return "date";
      const name = r.departmentName.trim();
      if (!name) return "deptEmpty";
      if (resolveDeptId(name) === null) return "deptUnmatched";
      if (!r.item.trim()) return "item";
      return null;
    },
    [resolveDeptId],
  );

  // ── 儲存（算出新增/修改/刪除） ───────────────────────────────
  async function onSave() {
    const rows = state.present;

    const problems: string[] = [];
    rows.forEach((r, i) => {
      const p = rowProblem(r);
      if (!p) return;
      const reason =
        p === "date"
          ? "缺日期"
          : p === "deptEmpty"
            ? "缺部門"
            : p === "deptUnmatched"
              ? "部門對不到清單"
              : "缺項目";
      problems.push(`第 ${i + 1} 列${reason}`);
    });
    if (problems.length > 0) {
      setFlash({
        ok: false,
        msg: `還有 ${problems.length} 列不能存：${problems.slice(0, 3).join("、")}${problems.length > 3 ? "…" : ""}`,
      });
      return;
    }

    const upserts: GridUpsertRow[] = [];
    const deleteSet = new Set<string>();

    const presentIds = new Set(rows.filter((r) => r.id).map((r) => r.id!));
    for (const id of baselineRef.current.keys()) {
      if (!presentIds.has(id)) deleteSet.add(id);
    }

    for (const r of rows) {
      const meaningful = isMeaningful(r);
      if (r.id && !meaningful) {
        deleteSet.add(r.id);
        continue;
      }
      if (!meaningful) continue;

      const deptId = resolveDeptId(r.departmentName) ?? "";
      const cur = normOf(r, deptId);
      const payload: GridUpsertRow = {
        entryDate: cur.entryDate,
        departmentId: cur.departmentId,
        carOrPerson: cur.carOrPerson || undefined,
        item: cur.item,
        income: cur.income,
        expense: cur.expense,
        note1: cur.note1 || undefined,
        note2: cur.note2 || undefined,
      };

      if (r.id) {
        const base = baselineRef.current.get(r.id);
        if (base && sameNorm(base, cur)) continue;
        payload.id = r.id;
      }
      upserts.push(payload);
    }

    const deletes = Array.from(deleteSet);
    if (upserts.length === 0 && deletes.length === 0) {
      setFlash({ ok: false, msg: "沒有任何變更需要儲存" });
      return;
    }
    if (upserts.length > 500) {
      setFlash({ ok: false, msg: "一次最多只能存 500 列，請分批處理" });
      return;
    }

    setPending(true);
    setFlash(null);
    const res = await saveLedgerGridAction({ upserts, deletes });
    setPending(false);

    if (!res.ok) {
      setFlash({ ok: false, msg: res.error });
      return;
    }
    setFlash({
      ok: true,
      msg: `已儲存：新增 ${res.inserted}、修改 ${res.updated}、刪除 ${res.deleted}`,
    });
    router.refresh();
  }

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return (
    <div className="space-y-4">
      {/* 工具列 */}
      <div className="bg-surface border border-hairline rounded-card shadow-premium-sm p-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => dispatch({ type: "undo" })}
          disabled={!canUndo}
        >
          復原
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => dispatch({ type: "redo" })}
          disabled={!canRedo}
        >
          重做
        </Button>
        <div className="w-px h-6 bg-hairline mx-1" />
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
          新增一列
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload />
          匯入 Excel/CSV
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={discard}>
          捨棄變更
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={removeSelected}
          disabled={selected.size === 0}
        >
          <Trash2 />
          刪除選取 ({selected.size})
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onImportFile}
        />
        <div className="ml-auto inline-flex items-center gap-3">
          {flash && (
            <span
              className={cn(
                "text-sm font-medium",
                flash.ok ? "text-positive" : "text-money",
              )}
            >
              {flash.msg}
            </span>
          )}
          <Button type="button" size="sm" onClick={onSave} disabled={pending}>
            {pending ? "儲存中..." : "儲存"}
          </Button>
        </div>
      </div>

      {/* 桌機：真試算表 */}
      <div className="hidden md:block">
        <SheetScroll
          ref={gridRef}
          role="grid"
          tabIndex={0}
          onKeyDown={onGridKeyDown}
          onCopy={onGridCopy}
          onPaste={onPaste}
          className="outline-none"
        >
          <SheetTable>
            <SheetHead>
              <tr>
                <SheetCorner className="w-16">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={
                        selected.size === state.present.length &&
                        state.present.length > 0
                      }
                      onChange={toggleAll}
                      className="size-3.5 accent-brand"
                      aria-label="全選"
                    />
                    <span>#</span>
                  </div>
                </SheetCorner>
                {COLS.map((col) => (
                  <SheetHeadCell key={col.field} style={{ width: col.width }}>
                    {col.label}
                  </SheetHeadCell>
                ))}
              </tr>
            </SheetHead>
            <tbody>
              {state.present.map((row, r) => {
                const problem = rowProblem(row);
                return (
                  <tr key={row.key}>
                    <SheetRowNum className="w-16">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={selected.has(row.key)}
                          onChange={() => toggleOne(row.key)}
                          className="size-3.5 accent-brand"
                          aria-label="選取此列"
                        />
                        <span>{r + 1}</span>
                      </div>
                    </SheetRowNum>
                    {COLS.map((col, c) => {
                      const isActive = active?.r === r && active?.c === c;
                      const invalid = isCellInvalid(problem, col.field);

                      // 部門欄：永遠渲染原生下拉，單擊即可選（免雙擊、免打字）
                      if (col.type === "dept") {
                        return (
                          <SheetCell
                            key={col.field}
                            onClick={() => selectCell(r, c)}
                            className={cn(
                              "h-9 p-0",
                              invalid && sheetInvalidCls,
                              isActive && sheetActiveCls,
                            )}
                            style={{ width: col.width }}
                          >
                            <DeptCellSelect
                              value={row.departmentName}
                              departments={departments}
                              unmatched={
                                !!row.departmentName.trim() &&
                                !nameToId.has(row.departmentName.trim())
                              }
                              onChange={(v) =>
                                update(r, { departmentName: v })
                              }
                            />
                          </SheetCell>
                        );
                      }

                      const isEditing = isActive && editing;
                      return (
                        <SheetCell
                          key={col.field}
                          onClick={() => selectCell(r, c)}
                          onDoubleClick={() => enterEdit(r, c)}
                          className={cn(
                            "h-9 cursor-cell",
                            col.right && "text-right",
                            invalid && sheetInvalidCls,
                            isActive && sheetActiveCls,
                          )}
                          style={{ width: col.width }}
                        >
                          {isEditing ? (
                            <CellEditor
                              col={col}
                              value={row[col.field]}
                              onChange={(v) => update(r, { [col.field]: v })}
                              onKeyDown={onEditorKeyDown}
                              onBlur={() => setEditing(false)}
                              selectAll={editSelectAll}
                            />
                          ) : (
                            <span className="block truncate">
                              {displayValue(row, col)}
                            </span>
                          )}
                        </SheetCell>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </SheetTable>
        </SheetScroll>
        <p className="mt-2 text-sm text-slate-500">
          共 <strong>{state.present.length}</strong> 列 · 復原棧{" "}
          {state.past.length} / 重做棧 {state.future.length}
        </p>
      </div>

      {/* 手機：每列一張卡片（觸控不適合試算表） */}
      <div className="md:hidden space-y-3">
        {state.present.map((row, idx) => {
          const problem = rowProblem(row);
          return (
            <div
              key={row.key}
              className="rounded-card border border-hairline bg-surface shadow-premium-sm p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-400">
                  第 {idx + 1} 列
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(idx)}
                  className="text-money"
                  aria-label="移除此列"
                >
                  <Trash2 />
                  移除
                </Button>
              </div>

              <CardField label="日期 *">
                <input
                  type="date"
                  value={row.entryDate}
                  onChange={(e) => update(idx, { entryDate: e.target.value })}
                  className={mobileInput(problem === "date")}
                />
              </CardField>
              <CardField label="部門名稱 *">
                <select
                  value={row.departmentName}
                  onChange={(e) =>
                    update(idx, { departmentName: e.target.value })
                  }
                  className={mobileInput(
                    problem === "deptEmpty" || problem === "deptUnmatched",
                  )}
                >
                  <option value="">請選擇</option>
                  {row.departmentName.trim() &&
                    !nameToId.has(row.departmentName.trim()) && (
                      <option value={row.departmentName}>
                        {row.departmentName}（未對應）
                      </option>
                    )}
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </CardField>
              <CardField label="車號/人名">
                <input
                  type="text"
                  value={row.carOrPerson}
                  onChange={(e) => update(idx, { carOrPerson: e.target.value })}
                  className={mobileInput(false)}
                />
              </CardField>
              <CardField label="項目 *">
                <input
                  type="text"
                  value={row.item}
                  onChange={(e) => update(idx, { item: e.target.value })}
                  className={mobileInput(problem === "item")}
                />
              </CardField>
              <div className="grid grid-cols-2 gap-3">
                <CardField label="收入">
                  <input
                    type="number"
                    step="0.01"
                    value={row.income}
                    placeholder="0"
                    onChange={(e) => update(idx, { income: e.target.value })}
                    className={mobileInput(
                      false,
                      "text-right text-positive font-bold",
                    )}
                  />
                </CardField>
                <CardField label="支出">
                  <input
                    type="number"
                    step="0.01"
                    value={row.expense}
                    placeholder="0"
                    onChange={(e) => update(idx, { expense: e.target.value })}
                    className={mobileInput(
                      false,
                      "text-right text-money font-bold",
                    )}
                  />
                </CardField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <CardField label="備註1">
                  <input
                    type="text"
                    value={row.note1}
                    onChange={(e) => update(idx, { note1: e.target.value })}
                    className={mobileInput(false)}
                  />
                </CardField>
                <CardField label="備註2">
                  <input
                    type="text"
                    value={row.note2}
                    onChange={(e) => update(idx, { note2: e.target.value })}
                    className={mobileInput(false)}
                  />
                </CardField>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** ISO `2026-05-23` → 顯示用斜線不補零 `2026/5/23`（底層仍存 ISO）。 */
function formatDateSlash(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/u);
  if (!m) return iso;
  return `${m[1]}/${Number(m[2])}/${Number(m[3])}`;
}

function displayValue(row: Row, col: Col): string {
  const raw = row[col.field];
  if (col.type === "number") {
    const n = num(raw);
    return n ? formatCurrency(n) : "";
  }
  if (col.type === "date") return formatDateSlash(raw);
  return raw;
}

/** 部門欄專用的原生下拉：值為部門名稱，單擊即可開啟選擇。 */
function DeptCellSelect({
  value,
  departments,
  unmatched,
  onChange,
}: {
  value: string;
  departments: Department[];
  unmatched: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // 阻止冒泡到儲存格的 onClick（selectCell→focusGrid 會把焦點搶走、害下拉瞬間收起）
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="w-full h-9 bg-transparent px-1 text-sm outline-none cursor-pointer"
    >
      <option value="">請選擇</option>
      {unmatched && <option value={value}>{value}（未對應）</option>}
      {departments.map((d) => (
        <option key={d.id} value={d.name}>
          {d.name}
        </option>
      ))}
    </select>
  );
}

function CellEditor({
  col,
  value,
  onChange,
  onKeyDown,
  onBlur,
  selectAll,
}: {
  col: Col;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  selectAll: boolean;
}) {
  const base = cn(
    "w-full h-full bg-surface px-1 text-sm outline-none",
    col.right && "text-right",
  );
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (selectAll) e.currentTarget.select();
  };

  if (col.type === "date")
    return (
      <input
        type="date"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        className={base}
      />
    );
  if (col.type === "number")
    return (
      <input
        type="number"
        step="0.01"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        className={base}
      />
    );
  return (
    <input
      type="text"
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      onFocus={onFocus}
      className={base}
    />
  );
}

function mobileInput(invalid: boolean, extra?: string) {
  return cn(
    "rounded-xl border bg-surface min-h-10 px-3 text-sm outline-none w-full " +
      "transition-[color,box-shadow] focus-visible:ring-4 focus-visible:ring-ring/25",
    invalid
      ? "border-money focus-visible:border-money focus-visible:ring-money/25"
      : "border-hairline focus-visible:border-brand",
    extra,
  );
}

function CardField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase text-slate-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
