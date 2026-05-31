"use client";

import { useActionState, useState, useEffect } from "react";
import { toast } from "sonner";
import { requestWithdrawalAction, type WithdrawalState } from "@/actions/withdrawal";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";
import { BankSelect } from "@/ui/bank-select";

const initial: WithdrawalState = { ok: false };

export function WithdrawalForm({ available }: { available: number }) {
  const [state, action, pending] = useActionState(requestWithdrawalAction, initial);
  const [amount, setAmount] = useState("");
  const [acked, setAcked] = useState(false);

  // render 期間派生：成功後清空金額（React 允許的條件 setState；收斂後停止）
  if (state.ok && !acked) {
    setAcked(true);
    setAmount("");
  } else if (!state.ok && acked) {
    setAcked(false);
  }

  // 副作用：成功通知（effect 內不呼叫 setState）
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "提領申請已送出");
  }, [state]);

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  return (
    <form action={action} className="space-y-4">
      {state.ok === false && state.error && (
        <Alert variant="danger">{state.error}</Alert>
      )}

      <Field label="提領金額" required hint="最低提領金額：$100" error={err("amount")}>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold pointer-events-none">
            $
          </span>
          <Input
            name="amount"
            required
            type="text"
            inputMode="numeric"
            inputSize="touch"
            className="pl-8"
            placeholder="100"
            value={amount}
            aria-invalid={!!err("amount")}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </Field>

      <Field label="銀行代碼（選填）" hint="不選則使用註冊時填寫的銀行">
        <BankSelect name="bankCode" placeholder="同註冊銀行（可改）" />
      </Field>

      <Field label="銀行帳號（選填）" hint="不填則使用註冊時填寫的帳號">
        <Input name="bankAccount" inputMode="numeric" inputSize="touch" />
      </Field>

      <Field label="備註（選填）">
        <Textarea name="note" rows={2} />
      </Field>

      <Button
        type="submit"
        size="touch"
        className="w-full text-xl"
        disabled={pending || available < 100}
      >
        {pending ? "送出中…" : "提交申請"}
      </Button>
      {available < 100 && (
        <p className="text-sm text-slate-500 text-center">可提領金額未達 $100</p>
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
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-money">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
      {error && (
        <p className="text-sm text-money font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
