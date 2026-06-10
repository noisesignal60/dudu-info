// 管理員登入失敗節流：純函式（不依賴 DB，方便重用與測試）

export const FAIL_THRESHOLD = 5; // 連續錯誤達此數開始鎖定

// 每多錯一次，鎖定時間遞增（分鐘），有上限：
// 第 5 次→1 分、第 6 次→5 分、第 7 次→15 分、第 8 次→30 分、第 9 次(含)以上→60 分
const SCHEDULE_MIN = [1, 5, 15, 30, 60];

// 依「目前累計失敗次數」回傳本次應鎖定的毫秒數；未達門檻回 0。
export function lockDurationMs(failedAttempts: number): number {
  if (failedAttempts < FAIL_THRESHOLD) return 0;
  const idx = Math.min(failedAttempts - FAIL_THRESHOLD, SCHEDULE_MIN.length - 1);
  return SCHEDULE_MIN[idx] * 60_000;
}

// 口語繁中倒數字串，例：「約 40 秒」「約 5 分鐘」
export function formatRetryAfter(ms: number): string {
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `約 ${sec} 秒`;
  return `約 ${Math.ceil(sec / 60)} 分鐘`;
}
