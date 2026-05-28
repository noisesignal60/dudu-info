"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type ProfileState } from "@/actions/profile";
import type { MemberProfile } from "@/data/member";
import { isValidBankAccount } from "@/lib/utils";

const initial: ProfileState = { ok: false };

export function ProfileBlock({ member }: { member: MemberProfile }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [bankAcc, setBankAcc] = useState(member.bankAccount ?? "");
  const [bankAccErr, setBankAccErr] = useState<string | null>(null);

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  // 成功後關閉編輯模式
  if (state.ok === true && editing) {
    queueMicrotask(() => setEditing(false));
  }

  if (!editing) {
    return (
      <div>
        {state.ok === true && (
          <div className="mb-4 rounded-xl bg-brand-soft text-brand-dark p-3 font-medium">
            ✓ {state.message}
          </div>
        )}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
          <Item label="姓名" value={member.name} />
          <Item label="Email" value={member.email} />
          <Item label="電話" value={member.phone} />
          <Item label="生日" value={member.birthday} />
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
          <button onClick={() => setEditing(true)} className="btn-secondary">
            編輯資料
          </button>
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
      <Field
        label="銀行代碼（選填）"
        defaultValue={member.bankCode ?? ""}
        name="bankCode"
      />
      <div>
        <label className="block mb-2 font-semibold text-slate-800">
          銀行帳號 <span className="text-money">*</span>
        </label>
        <input
          name="bankAccount"
          required
          inputMode="numeric"
          className="input-base"
          value={bankAcc}
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
          <p className="mt-1.5 text-sm text-money font-medium">
            {bankAccErr ?? err("bankAccount")}
          </p>
        )}
      </div>

      {state.ok === false && state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3">
          {state.error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={pending}>
          {pending ? "儲存中…" : "儲存變更"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setEditing(false)}
          disabled={pending}
        >
          取消
        </button>
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
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd
        className={`mt-0.5 font-semibold ${
          highlight ? "text-brand-dark tracking-widest" : "text-slate-900"
        }`}
      >
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
    <div>
      <label className="block mb-2 font-semibold text-slate-800">
        {label}
        {required && <span className="text-money ml-1">*</span>}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="input-base"
      />
      {err && <p className="mt-1.5 text-sm text-money font-medium">{err}</p>}
    </div>
  );
}
