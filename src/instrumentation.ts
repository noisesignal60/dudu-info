import { z } from "zod";

/**
 * 伺服器啟動時執行一次（Next.js instrumentation）。
 * 設定 Zod 全域錯誤訊息為口語化繁體中文：
 * - 欄位自訂訊息（如「請輸入姓名」）優先序最高，照常顯示。
 * - 沒有自訂訊息的破口（如型別錯誤 null）改顯示友善句子，杜絕技術字眼與英文。
 */
export function register() {
  z.config({
    // 保底語系（繁中）
    localeError: z.locales.zhTW().localeError,
    // 口語化覆蓋
    customError: (issue) => {
      switch (issue.code) {
        case "invalid_type":
        case "too_small":
          return "請填寫此欄位";
        case "too_big":
          return "輸入內容過長";
        case "invalid_format":
          return "格式不正確";
        default:
          return "輸入內容不正確，請再確認";
      }
    },
  });
}
