"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  replaceMemberPassbookAction,
  type AdminMemberFormState,
} from "@/actions/admin-members";
import { Button } from "@/ui/button";
import { Alert } from "@/ui/alert";

const initial: AdminMemberFormState = { ok: false };

export function PassbookReplaceForm({ memberId }: { memberId: string }) {
  const action = replaceMemberPassbookAction.bind(null, memberId);
  const [state, formAction, pending] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "已更新");
      formRef.current?.reset();
    }
  }, [state]);

  const fieldErr = state.ok === false ? state.fieldErrors?.passbook : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {state.ok === false && state.error && (
        <Alert variant="danger">{state.error}</Alert>
      )}

      <input
        ref={inputRef}
        type="file"
        name="passbook"
        accept="image/*"
        hidden
        onChange={() => {
          if (inputRef.current?.files?.length) {
            formRef.current?.requestSubmit();
          }
        }}
      />

      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "上傳中…" : "更換存摺圖片"}
      </Button>

      {fieldErr && <p className="text-sm text-money font-medium">{fieldErr}</p>}
    </form>
  );
}
