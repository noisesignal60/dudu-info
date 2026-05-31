"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  updateMemberBalanceAction,
  type AdminMemberFormState,
} from "@/actions/admin-members";
import type { AdminMemberRow } from "@/data/admin/members";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";

const initial: AdminMemberFormState = { ok: false };

export function MemberBalanceForm({ member }: { member: AdminMemberRow }) {
  const action = updateMemberBalanceAction.bind(null, member.id);
  const [state, formAction, pending] = useActionState(action, initial);
  const [acked, setAcked] = useState(false);

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  if (state.ok && !acked) {
    setAcked(true);
  } else if (!state.ok && acked) {
    setAcked(false);
  }

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "已更新");
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      {state.ok === false && state.error && (
        <Alert variant="danger">{state.error}</Alert>
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

      <Alert variant="info">
        <span className="font-semibold">鎖定金額：</span>
        <span className="tabular-nums">{formatCurrency(member.locked)}</span>
        （審核中的提領，由系統自動維護）
      </Alert>

      <div className="pt-1">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "儲存中…" : "儲存餘額"}
        </Button>
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
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        min={0}
        step="0.01"
        defaultValue={defaultValue}
        inputSize="sm"
        aria-invalid={!!err}
        className="tabular-nums"
      />
      {err && <p className="text-sm text-money font-medium">{err}</p>}
    </div>
  );
}
