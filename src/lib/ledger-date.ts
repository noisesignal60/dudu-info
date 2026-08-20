/**
 * 帳簿查詢的日期視窗計算。
 *
 * 這裡是「篩選條件 → SQL 時間範圍」的唯一出處：讀取端（src/data/reports/ledger.ts）
 * 與匯出 CSV（src/actions/reports-ledger.ts）都必須共用，否則會出現
 *「畫面看到 30 筆、匯出卻拿到 300 筆」這種對不起來的狀況。
 *
 * 一律回傳半開區間 `[from, to)`，查詢端固定套 `.gte("entry_date", from)`
 * 與 `.lt("entry_date", to)`；`null` 表示該側不設限。
 */

/** ISO 純日期格式 YYYY-MM-DD。 */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;

/** 是否為合法的 ISO 純日期字串（網址參數可能被亂改，一律先驗證）。 */
export function isIsoDate(value: string | undefined | null): value is string {
  return typeof value === "string" && ISO_DATE_RE.test(value);
}

/** ISO 日期 +1 天（以 UTC 計算，純日期不受時區影響）。 */
export function addOneDayISO(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10);
}

export type DateRangeParams = {
  /** 起日（含當日），ISO YYYY-MM-DD。 */
  from?: string;
  /** 訖日（含當日），ISO YYYY-MM-DD。 */
  to?: string;
  /** 單一日期，ISO YYYY-MM-DD。 */
  day?: string;
  year?: number;
  month?: number; // 1-12
  quarter?: number; // 1-4
};

export type DateRange = { from: string | null; to: string | null };

/**
 * 依篩選條件算出查詢用的半開區間 `[from, to)`。
 *
 * 優先序：自訂區間（from/to）> 單日（day）> 年+月 > 年+季 > 年 > 不限。
 * 使用者視角的 `to` / `day` 都「含當日」，內部 +1 天轉成排他上界。
 * 格式不合法的值一律忽略；`from > to` 時自動對調，避免查出空白卻看不出原因。
 */
export function resolveDateRange(params: DateRangeParams = {}): DateRange {
  const rawFrom = isIsoDate(params.from) ? params.from : "";
  const rawTo = isIsoDate(params.to) ? params.to : "";

  if (rawFrom || rawTo) {
    // 反向區間視為使用者填反了，對調即可（UI 另有 min/max 防呆）
    const swap = rawFrom && rawTo && rawFrom > rawTo;
    const start = swap ? rawTo : rawFrom;
    const end = swap ? rawFrom : rawTo;
    return {
      from: start || null,
      to: end ? addOneDayISO(end) : null,
    };
  }

  if (isIsoDate(params.day)) {
    return { from: params.day, to: addOneDayISO(params.day) };
  }

  const year = params.year ?? 0;
  const month = params.month ?? 0;
  const quarter = params.quarter ?? 0;

  if (year && month) {
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    return {
      from: `${year}-${pad(month)}-01`,
      to: `${next.y}-${pad(next.m)}-01`,
    };
  }

  if (year && quarter) {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = startMonth + 3;
    const next = endMonth > 12 ? { y: year + 1, m: 1 } : { y: year, m: endMonth };
    return {
      from: `${year}-${pad(startMonth)}-01`,
      to: `${next.y}-${pad(next.m)}-01`,
    };
  }

  if (year) {
    return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
  }

  return { from: null, to: null };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
