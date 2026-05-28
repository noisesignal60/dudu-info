"use client";

import { useActionState } from "react";
import {
  updateMemberBasicAction,
  type AdminMemberFormState,
} from "@/actions/admin-members";
import type { AdminMemberRow } from "@/data/admin/members";

const initial: AdminMemberFormState = { ok: false };

export function MemberBasicForm({ member }: { member: AdminMemberRow }) {
  const action = updateMemberBasicAction.bind(null, member.id);
  const [state, formAction, pending] = useActionState(action, initial);

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.ok === true && (
        <Banner tone="ok">{state.message}</Banner>
      )}
      {state.ok === false && state.error && (
        <Banner tone="err">{state.error}</Banner>
      )}

      <Row>
        <Field label="姓名" name="name" defaultValue={member.name ?? ""} err={err("name")} />
        <Field label="Email" name="email" defaultValue={member.email ?? ""} err={err("email")} />
      </Row>
      <Row>
        <Field label="電話" name="phone" defaultValue={member.phone ?? ""} err={err("phone")} />
        <Field label="銀行代碼" name="bankCode" defaultValue={member.bankCode ?? ""} err={err("bankCode")} />
      </Row>
      <Row>
        <Field label="銀行戶名" name="bankHolder" defaultValue={member.bankHolder ?? ""} err={err("bankHolder")} />
        <Field label="銀行帳號" name="bankAccount" defaultValue={member.bankAccount ?? ""} err={err("bankAccount")} />
      </Row>

      <div className="pt-2">
        <button type="submit" className="btn-primary !min-h-11 !text-base" disabled={pending}>
          {pending ? "儲存中…" : "儲存基本資料"}
        </button>
      </div>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  name,
  defaultValue,
  err,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  err?: string;
}) {
  return (
    <div>
      <label className="block mb-1.5 text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="input-base !min-h-10 !text-sm"
      />
      {err && <p className="mt-1 text-xs text-money">{err}</p>}
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "ok" | "err";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-sm ${
        tone === "ok"
          ? "bg-brand-soft text-brand-dark border border-brand/30"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      {children}
    </div>
  );
}
