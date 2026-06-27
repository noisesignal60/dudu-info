/**
 * 帳簿匯入 / 貼上的純函式工具。
 *
 * 同時服務兩條路徑：
 *  - 從 Excel 複製貼上（剪貼簿 TSV）
 *  - 匯入 .xlsx / CSV（SheetJS 解析後的二維陣列）
 *
 * 不含任何 React，方便單獨推理與測試。
 */

/** 匯入欄位順序，與 CSV 匯出（exportLedgerCsvAction）一致，可無痛來回。 */
export const IMPORT_COLUMNS = [
  "日期",
  "部門名稱",
  "車號/人名",
  "項目",
  "金額",
  "備註1",
  "備註2",
] as const;

/** 對應到網格列的欄位名稱，順序與 IMPORT_COLUMNS 一一對應。 */
export const ROW_FIELDS = [
  "entryDate",
  "departmentName",
  "carOrPerson",
  "item",
  "amount",
  "note1",
  "note2",
] as const;

export type RowField = (typeof ROW_FIELDS)[number];

export type GridRowInput = {
  entryDate: string;
  departmentName: string;
  carOrPerson: string;
  item: string;
  amount: string; // 帶正負號：正＝收入、負＝支出
  note1: string;
  note2: string;
};

function toISODate(y: number, mo: number, d: number): string {
  if (!Number.isFinite(y) || mo < 1 || mo > 12 || d < 1 || d > 31) return "";
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 接受 Date、`YYYY-MM-DD`、`YYYY/M/D`、`YYYY.M.D`；無法解析則回空字串。 */
export function normalizeDate(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toISODate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  const s = String(value).trim();
  if (!s) return "";
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/u);
  if (m) return toISODate(Number(m[1]), Number(m[2]), Number(m[3]));
  return "";
}

/** 去除千分位逗號、貨幣符號、空白後保留數字字串；非數字回空字串。 */
export function parseAmount(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  let s = String(value).trim();
  if (!s) return "";
  // 移除貨幣符號、千分位、全形逗號與空白
  s = s.replace(/[,\s$＄NT＄、，]/gu, "");
  s = s.replace(/[^0-9.\-]/gu, "");
  if (s === "" || s === "-" || s === ".") return "";
  const n = Number(s);
  return Number.isFinite(n) ? String(n) : "";
}

/** 依欄位型別正規化單一儲存格的原始字串（供逐格貼上使用）。 */
export function normalizeField(field: RowField, raw: string): string {
  if (field === "entryDate") return normalizeDate(raw);
  if (field === "amount") return parseAmount(raw);
  return raw.trim();
}

/** 剪貼簿純文字 → 二維陣列（依換行分列、Tab 分欄）。 */
export function parseClipboardTSV(text: string): string[][] {
  const normalized = text.replace(/\r\n?/gu, "\n").replace(/\n+$/u, "");
  if (normalized === "") return [];
  return normalized.split("\n").map((line) => line.split("\t"));
}

function isHeaderRow(row: unknown[]): boolean {
  const first = String(row?.[0] ?? "").trim();
  return (IMPORT_COLUMNS as readonly string[]).includes(first);
}

function isEmptyRow(row: unknown[]): boolean {
  return row.every((c) => c == null || String(c).trim() === "");
}

/** 單列（依固定欄序）→ 網格列輸入。 */
export function cellsToRow(cells: unknown[]): GridRowInput {
  const text = (i: number) => (cells[i] == null ? "" : String(cells[i]).trim());
  return {
    entryDate: normalizeDate(cells[0]),
    departmentName: text(1),
    carOrPerson: text(2),
    item: text(3),
    amount: parseAmount(cells[4]),
    note1: text(5),
    note2: text(6),
  };
}

/** 二維陣列 → 網格列輸入；自動略過標題列與全空白列。 */
export function aoaToRows(aoa: unknown[][]): GridRowInput[] {
  if (!aoa.length) return [];
  const start = isHeaderRow(aoa[0]) ? 1 : 0;
  const out: GridRowInput[] = [];
  for (let i = start; i < aoa.length; i++) {
    const r = aoa[i] ?? [];
    if (isEmptyRow(r)) continue;
    out.push(cellsToRow(r));
  }
  return out;
}
