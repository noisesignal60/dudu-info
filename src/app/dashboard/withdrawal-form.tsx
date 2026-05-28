"use client";

import { useActionState, useState } from "react";
import { requestWithdrawalAction, type WithdrawalState } from "@/actions/withdrawal";

const initial: WithdrawalState = { ok: false };

export function WithdrawalForm({ available }: { available: number }) {
  const [state, action, pending] = useActionState(requestWithdrawalAction, initial);
  const [amount, setAmount] = useState("");
  // 用 React 官方「同步 prop」pattern：當 state.ok 變 true 時清空 amount
  const [seenSuccess, setSeenSuccess] = useState(false);
  if (state.ok && !seenSuccess) {
    setSeenSuccess(true);
    setAmount("");
  } else if (!state.ok && seenSuccess) {
    setSeenSuccess(false);
  }

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  return (
    <form action={action} className="space-y-4">
      {state.ok === true && (
        <div className="rounded-xl bg-brand-soft border border-brand/30 text-brand-dark p-4 font-medium">
          ✓ {state.message}
        </div>
      )}
      {state.ok === false && state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4">
          {state.error}
        </div>
      )}

      <Field label="提領金額" required hint="最低提領金額：$100" error={err("amount")}>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
            $
          </span>
          <input
            name="amount"
            required
            type="number"
            min={100}
            max={available}
            inputMode="numeric"
            className="input-base pl-8 text-xl font-bold"
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </Field>

      <Field label="銀行代碼（選填）">
        <input name="bankCode" className="input-base" placeholder="使用註冊時填寫的銀行" />
      </Field>

      <Field label="銀行帳號（選填）" hint="不填則使用註冊時填寫的帳號">
        <input name="bankAccount" inputMode="numeric" className="input-base" />
      </Field>

      <Field label="備註（選填）">
        <textarea name="note" className="input-base min-h-[3rem] py-3" rows={2} />
      </Field>

      <button
        type="submit"
        className="btn-primary w-full text-xl"
        disabled={pending || available < 100}
      >
        {pending ? "送出中…" : "提交申請"}
      </button>
      {available < 100 && (
        <p className="text-sm text-slate-500 text-center">
          可提領金額未達 $100
        </p>
      )}
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
      {hint && !error && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-sm text-money font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
