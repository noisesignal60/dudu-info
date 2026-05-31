"use client";

import { TAIWAN_BANKS } from "@/lib/banks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

/**
 * 銀行代碼下拉選單。包裝 shadcn Select，選項來自 TAIWAN_BANKS。
 * 在 <form action={...}> 中透過 Radix 的 name 自動產生隱藏 select 提交「3 碼代碼」。
 * 未選擇時提交空字串，與原本的 <Input> 行為一致。
 */
export function BankSelect({
  name,
  defaultValue,
  placeholder = "請選擇銀行",
  size = "touch",
  "aria-invalid": ariaInvalid,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  size?: "touch" | "default" | "sm";
  "aria-invalid"?: boolean;
}) {
  return (
    <Select name={name} defaultValue={defaultValue || undefined}>
      <SelectTrigger size={size} aria-invalid={ariaInvalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {TAIWAN_BANKS.map((b) => (
          <SelectItem key={b.code} value={b.code}>
            {b.code} {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
