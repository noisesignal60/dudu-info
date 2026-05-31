"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import {
  createAdminAction,
  updateAdminAction,
  resetAdminPasswordAction,
  toggleAdminActiveAction,
  type AdminFormState,
} from "@/actions/admin-admins";
import type { AdminRow } from "@/data/admin/admins";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";

const initial: AdminFormState = { ok: false };

type Props =
  | { mode: "create"; admin?: undefined; isSelf?: undefined }
  | { mode: "row"; admin: AdminRow; isSelf: boolean };

export function AdminListActions(props: Props) {
  const [mode, setMode] = useState<"none" | "create" | "edit" | "reset">("none");

  if (props.mode === "create") {
    return (
      <>
        <Button type="button" size="sm" onClick={() => setMode("create")}>
          新增管理員
        </Button>
        <CreateModal
          open={mode === "create"}
          onClose={() => setMode("none")}
        />
      </>
    );
  }

  const { admin, isSelf } = props;

  return (
    <div className="inline-flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => setMode("edit")}
        title="編輯姓名"
      >
        編輯
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => setMode("reset")}
      >
        重設密碼
      </Button>
      <ToggleActiveButton admin={admin} disabled={isSelf} />

      <EditModal
        admin={admin}
        open={mode === "edit"}
        onClose={() => setMode("none")}
      />
      <ResetPasswordModal
        admin={admin}
        open={mode === "reset"}
        onClose={() => setMode("none")}
      />
    </div>
  );
}

function ToggleActiveButton({
  admin,
  disabled,
}: {
  admin: AdminRow;
  disabled: boolean;
}) {
  const [pending, start] = useTransition();
  function onClick() {
    if (disabled) return;
    const msg = admin.isActive
      ? `確定要停用「${admin.displayName}」？`
      : `確定要重新啟用「${admin.displayName}」？`;
    if (!window.confirm(msg)) return;
    start(async () => {
      const res = await toggleAdminActiveAction(admin.id, !admin.isActive);
      if (!res.ok) alert(res.error ?? "操作失敗");
    });
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      title={disabled ? "不可停用自己" : admin.isActive ? "停用" : "啟用"}
    >
      {admin.isActive ? "停用" : "啟用"}
    </Button>
  );
}

function CreateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createAdminAction, initial);

  const [acked, setAcked] = useState(false);
  if (state.ok && !acked) {
    setAcked(true);
    onClose();
  } else if (!state.ok && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "已新增管理員");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增管理員</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <Field
            label="帳號 *"
            name="username"
            placeholder="僅英數與 . _ -"
            err={!state.ok ? state.fieldErrors?.username : undefined}
          />
          <Field
            label="姓名 *"
            name="displayName"
            placeholder="顯示用名稱"
            err={!state.ok ? state.fieldErrors?.displayName : undefined}
          />
          <Field
            label="密碼 *"
            name="password"
            type="password"
            placeholder="至少 8 字元"
            err={!state.ok ? state.fieldErrors?.password : undefined}
          />
          {!state.ok && state.error && (
            <Alert variant="danger">{state.error}</Alert>
          )}
          <ModalFooter onClose={onClose} pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditModal({
  admin,
  open,
  onClose,
}: {
  admin: AdminRow;
  open: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    updateAdminAction.bind(null, admin.id),
    initial,
  );

  const [acked, setAcked] = useState(false);
  if (state.ok && !acked) {
    setAcked(true);
    onClose();
  } else if (!state.ok && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "已更新");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯：{admin.username}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <Field
            label="姓名 *"
            name="displayName"
            defaultValue={admin.displayName}
            err={!state.ok ? state.fieldErrors?.displayName : undefined}
          />
          {!state.ok && state.error && (
            <Alert variant="danger">{state.error}</Alert>
          )}
          <ModalFooter onClose={onClose} pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordModal({
  admin,
  open,
  onClose,
}: {
  admin: AdminRow;
  open: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    resetAdminPasswordAction.bind(null, admin.id),
    initial,
  );

  const [acked, setAcked] = useState(false);
  if (state.ok && !acked) {
    setAcked(true);
    onClose();
  } else if (!state.ok && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "已重設密碼");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重設「{admin.username}」的密碼</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <Field
            label="新密碼 *"
            name="password"
            type="password"
            placeholder="至少 8 字元"
            err={!state.ok ? state.fieldErrors?.password : undefined}
          />
          {!state.ok && state.error && (
            <Alert variant="danger">{state.error}</Alert>
          )}
          <ModalFooter onClose={onClose} pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  err,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  err?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        inputSize="sm"
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={!!err}
      />
      {err && <p className="text-sm text-money font-medium">{err}</p>}
    </div>
  );
}

function ModalFooter({
  onClose,
  pending,
}: {
  onClose: () => void;
  pending: boolean;
}) {
  return (
    <DialogFooter>
      <Button variant="secondary" size="sm" type="button" onClick={onClose}>
        取消
      </Button>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "處理中..." : "送出"}
      </Button>
    </DialogFooter>
  );
}
