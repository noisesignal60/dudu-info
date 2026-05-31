"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  updateMemberBasicAction,
  type AdminMemberFormState,
} from "@/actions/admin-members";
import type { AdminMemberRow } from "@/data/admin/members";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";

const initial: AdminMemberFormState = { ok: false };

export function MemberBasicForm({ member }: { member: AdminMemberRow }) {
  const action = updateMemberBasicAction.bind(null, member.id);
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
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "儲存中…" : "儲存基本資料"}
        </Button>
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
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        inputSize="sm"
        aria-invalid={!!err}
      />
      {err && <p className="text-sm text-money font-medium">{err}</p>}
    </div>
  );
}
