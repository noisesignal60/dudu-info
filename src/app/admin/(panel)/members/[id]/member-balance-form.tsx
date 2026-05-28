"use client";

import { useActionState } from "react";
import {
  updateMemberBalanceAction,
  type AdminMemberFormState,
} from "@/actions/admin-members";
import type { AdminMemberRow } from "@/data/admin/members";
import { formatCurrency } from "@/lib/utils";

const initial: AdminMemberFormState = { ok: false };

export function MemberBalanceForm({ member }: { member: AdminMemberRow }) {
  const action = updateMemberBalanceAction.bind(null, member.id);
  const [state, formAction, pending] = useActionState(action, initial);

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.ok === true && (
        <div className="rounded-xl p-3 text-sm bg-brand-soft text-brand-dark border border-brand/30">
          {state.message}
        </div>
      )}
      {state.ok === false && state.error && (
        <div className="rounded-xl p-3 text-sm bg-red-50 text-red-700 border border-red-200">
          {state.error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <Field
          label="總收益金額"
          name="totalEarned"
          defaultValue={member.totalEarned}
          err={err("totalEarned")}
        />
        <Field
          label="待提領金額"
          name="pending"
          defaultValue={member.pending}
          err={err("pending")}
        />
        <Field
          label="已提領金額"
          name="withdrawn"
          defaultValue={member.withdrawn}
          err={err("withdrawn")}
        />
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
        <span className="font-semibold">鎖定金額：</span>
        {formatCurrency(member.locked)}（審核中的提領，由系統自動維護）
      </div>

      <div className="pt-1">
        <button type="submit" className="btn-primary !min-h-11 !text-base" disabled={pending}>
          {pending ? "儲存中…" : "儲存餘額"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  err,
}: {
  label: string;
  name: string;
  defaultValue: number;
  err?: string;
}) {
  return (
    <div>
      <label className="block mb-1.5 text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        name={name}
        type="number"
        min={0}
        step="0.01"
        defaultValue={defaultValue}
        className="input-base !min-h-10 !text-sm tabular-nums"
      />
      {err && <p className="mt-1 text-xs text-money">{err}</p>}
    </div>
  );
}
