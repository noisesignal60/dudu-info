"use client";

import { useActionState, useState } from "react";
import { completeOnboardingAction, type OnboardingState } from "@/actions/onboarding";
import { isValidBankAccount } from "@/lib/utils";

const initial: OnboardingState = { ok: false };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboardingAction, initial);
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountError, setBankAccountError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function err(field: string): string | undefined {
    return state.ok === false ? state.fieldErrors?.[field] : undefined;
  }

  return (
    <form action={action} className="space-y-5">
      {/* 全域錯誤 */}
      {state.ok === false && state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4">
          {state.error}
        </div>
      )}

      <Field label="姓名" required error={err("name")}>
        <input name="name" required className="input-base" placeholder="王大明" />
      </Field>

      <Field label="行動電話" required error={err("phone")}>
        <input
          name="phone"
          required
          type="tel"
          inputMode="tel"
          className="input-base"
          placeholder="0912345678"
        />
      </Field>

      <Field label="銀行戶名" required error={err("bankHolder")}>
        <input name="bankHolder" required className="input-base" placeholder="王大明" />
      </Field>

      <Field label="銀行代碼（選填）">
        <input name="bankCode" className="input-base" placeholder="例如：004 臺灣銀行" />
      </Field>

      <Field
        label="銀行帳號"
        required
        hint="請輸入 10~16 碼數字（不含 - 符號）"
        error={bankAccountError ?? err("bankAccount")}
      >
        <input
          name="bankAccount"
          required
          inputMode="numeric"
          className="input-base"
          placeholder="0000000000000"
          value={bankAccount}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d]/g, "");
            setBankAccount(v);
            if (v.length === 0) setBankAccountError(null);
            else if (!isValidBankAccount(v))
              setBankAccountError("銀行帳號格式錯誤（10~16 碼數字）");
            else setBankAccountError(null);
          }}
        />
      </Field>

      <Field
        label="銀行存摺圖片"
        required
        hint="上傳後系統會自動加上「嘟嘟資訊網」浮水印，且無法重新上傳"
        error={err("passbook")}
      >
        <label className="block">
          <input
            name="passbook"
            type="file"
            accept="image/*"
            required
            className="block w-full text-base text-slate-700
                       file:mr-4 file:py-3 file:px-5 file:rounded-xl
                       file:border-0 file:text-base file:font-semibold
                       file:bg-brand-soft file:text-brand-dark
                       hover:file:bg-brand/20 cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPreviewUrl(URL.createObjectURL(f));
              }
            }}
          />
        </label>
        {previewUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="存摺預覽" className="w-full" />
            <p className="text-xs text-slate-500 p-2 text-center">
              ※ 預覽圖未加浮水印；正式儲存時會自動加上。
            </p>
          </div>
        )}
      </Field>

      <Field label="推薦碼（選填）" hint="若有介紹人，請輸入對方的推薦碼">
        <input
          name="referralCode"
          className="input-base uppercase"
          placeholder="例如：AB3X9Z"
          maxLength={10}
        />
      </Field>

      <button
        type="submit"
        className="btn-primary w-full text-xl mt-4"
        disabled={pending}
      >
        {pending ? "送出中…" : "完成註冊，進入系統"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-2 font-semibold text-slate-800">
        {label}
        {required && <span className="text-money ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1.5 text-sm text-money font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
