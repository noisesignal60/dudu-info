import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `$${n.toLocaleString("zh-TW")}`;
}

/** 純數字金額（千分位、無貨幣符號）。報表帳簿用，避免大字體下 $ 占位干擾。 */
export function formatAmount(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString("zh-TW");
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** 台灣常見銀行帳號格式：純數字 10~16 碼 */
export function isValidBankAccount(value: string): boolean {
  return /^\d{10,16}$/.test(value.replace(/\s|-/g, ""));
}
