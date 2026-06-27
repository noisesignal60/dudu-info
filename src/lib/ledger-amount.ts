/**
 * 帳簿金額轉換工具：UI 用單一帶正負號「金額」欄，DB 仍存 income / expense 兩欄。
 *
 * 約定：正數＝收入、負數＝支出。純函式、無 React，供 server action 與各元件共用。
 */

/** 帶正負號金額 → DB 的 income / expense（正進收入、負進支出，皆為非負數）。 */
export function splitAmount(amount: number): { income: number; expense: number } {
  const n = Number(amount) || 0;
  return n >= 0 ? { income: n, expense: 0 } : { income: 0, expense: -n };
}

/** DB 的 income / expense → UI 的帶正負號金額（淨額）。 */
export function toSignedAmount(
  income: number | null | undefined,
  expense: number | null | undefined,
): number {
  return (Number(income) || 0) - (Number(expense) || 0);
}
