"use client";

import { useActionState, useState, useEffect } from "react";
import { toast } from "sonner";
import { updateProfileAction, type ProfileState } from "@/actions/profile";
import type { MemberProfile } from "@/data/member";
import { isValidBankAccount } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";
import { BankSelect } from "@/ui/bank-select";

const initial: ProfileState = { ok: false };

export function ProfileBlock({ member }: { member: MemberProfile }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [bankAcc, setBankAcc] = useState(member.bankAccount ?? "");
  const [bankAccErr, setBankAccErr] = useState<string | null>(null);
  const [acked, setAcked] = useState(false);

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  // render 期間派生：成功後關閉編輯模式（按一次成功只關一次，可再次編輯）
  if (state.ok && !acked) {
    setAcked(true);
    setEditing(false);
  } else if (!state.ok && acked) {
    setAcked(false);
  }

  // 副作用：成功通知（effect 內不呼叫 setState）
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "資料已更新");
  }, [state]);

  if (!editing) {
    return (
      <div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Item label="姓名" value={member.name} />
          <Item label="電話" value={member.phone} />
          <Item label="我的推薦碼" value={member.referralCode} highlight />
          <Item
            label="我的上級"
            value={
              member.uplineName
                ? `${member.uplineName} (${member.uplineReferralCode})`
                : "—"
            }
          />
          <Item label="銀行戶名" value={member.bankHolder} />
          <Item label="銀行帳號" value={member.bankAccount} />
        </dl>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" size="touch" onClick={() => setEditing(true)}>
            編輯資料
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          ※ 銀行存摺圖片為憑證，無法自行更換；如需更換請聯絡客服。
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="姓名" required defaultValue={member.name ?? ""} name="name" err={err("name")} />
      <Field label="行動電話" required defaultValue={member.phone ?? ""} name="phone" type="tel" err={err("phone")} />
      <Field
        label="銀行戶名"
        required
        defaultValue={member.bankHolder ?? ""}
        name="bankHolder"
        err={err("bankHolder")}
      />
      <div className="space-y-2">
        <Label>銀行代碼（選填）</Label>
        <BankSelect name="bankCode" defaultValue={member.bankCode ?? undefined} />
      </div>
      <div className="space-y-2">
        <Label>
          銀行帳號 <span className="text-money">*</span>
        </Label>
        <Input
          name="bankAccount"
          required
          inputMode="numeric"
          inputSize="touch"
          value={bankAcc}
          aria-invalid={!!(bankAccErr || err("bankAccount"))}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d]/g, "");
            setBankAcc(v);
            if (!v) setBankAccErr(null);
            else if (!isValidBankAccount(v))
              setBankAccErr("銀行帳號格式錯誤（10~16 碼數字）");
            else setBankAccErr(null);
          }}
        />
        {(bankAccErr || err("bankAccount")) && (
          <p className="text-sm text-money font-medium">
            {bankAccErr ?? err("bankAccount")}
          </p>
        )}
      </div>

      {state.ok === false && state.error && (
        <Alert variant="danger">{state.error}</Alert>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" size="touch" className="flex-1" disabled={pending}>
          {pending ? "儲存中…" : "儲存變更"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="touch"
          onClick={() => setEditing(false)}
          disabled={pending}
        >
          取消
        </Button>
      </div>
    </form>
  );
}

function Item({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  if (highlight) {
    // 推薦碼：顯眼的純品牌色背板
    return (
      <div className="rounded-xl bg-brand px-4 py-3 sm:col-span-2">
        <dt className="text-sm font-medium text-white/85">{label}</dt>
        <dd className="mt-0.5 text-2xl font-black tracking-widest text-white">
          {value || "—"}
        </dd>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-hairline bg-canvas px-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900 break-words">
        {value || "—"}
      </dd>
    </div>
  );
}

function Field({
  label,
  required,
  defaultValue,
  name,
  type = "text",
  err,
}: {
  label: string;
  required?: boolean;
  defaultValue?: string;
  name: string;
  type?: string;
  err?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-money">*</span>}
      </Label>
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        inputSize="touch"
        aria-invalid={!!err}
      />
      {err && <p className="text-sm text-money font-medium">{err}</p>}
    </div>
  );
}
