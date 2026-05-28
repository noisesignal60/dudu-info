"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { Plus, KeyRound, Pencil, Power } from "lucide-react";
import {
  createAdminAction,
  updateAdminAction,
  resetAdminPasswordAction,
  toggleAdminActiveAction,
  type AdminFormState,
} from "@/actions/admin-admins";
import type { AdminRow } from "@/data/admin/admins";

const initial: AdminFormState = { ok: false };

type Props =
  | { mode: "create"; admin?: undefined; isSelf?: undefined }
  | { mode: "row"; admin: AdminRow; isSelf: boolean };

export function AdminListActions(props: Props) {
  const [mode, setMode] = useState<"none" | "create" | "edit" | "reset">("none");

  if (props.mode === "create") {
    return (
      <>
        <button
          type="button"
          onClick={() => setMode("create")}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          新增管理員
        </button>
        {mode === "create" && <CreateModal onClose={() => setMode("none")} />}
      </>
    );
  }

  const { admin, isSelf } = props;

  return (
    <div className="inline-flex gap-1">
      <button
        type="button"
        onClick={() => setMode("edit")}
        className="inline-flex items-center gap-1 px-2 py-1 text-sm text-slate-700 hover:text-brand-dark"
        title="編輯姓名"
      >
        <Pencil className="w-4 h-4" />
        編輯
      </button>
      <button
        type="button"
        onClick={() => setMode("reset")}
        className="inline-flex items-center gap-1 px-2 py-1 text-sm text-slate-700 hover:text-brand-dark"
      >
        <KeyRound className="w-4 h-4" />
        重設密碼
      </button>
      <ToggleActiveButton admin={admin} disabled={isSelf} />

      {mode === "edit" && (
        <EditModal admin={admin} onClose={() => setMode("none")} />
      )}
      {mode === "reset" && (
        <ResetPasswordModal admin={admin} onClose={() => setMode("none")} />
      )}
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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      title={disabled ? "不可停用自己" : admin.isActive ? "停用" : "啟用"}
      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-slate-700 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Power className="w-4 h-4" />
      {admin.isActive ? "停用" : "啟用"}
    </button>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createAdminAction, initial);

  if (state.ok) {
    setTimeout(onClose, 600);
  }

  return (
    <ModalShell title="新增管理員" onClose={onClose}>
      <form action={action} className="space-y-4">
        <Field label="帳號 *" name="username" placeholder="僅英數與 . _ -" />
        {!state.ok && state.fieldErrors?.username && (
          <ErrMsg>{state.fieldErrors.username}</ErrMsg>
        )}
        <Field label="姓名 *" name="displayName" placeholder="顯示用名稱" />
        {!state.ok && state.fieldErrors?.displayName && (
          <ErrMsg>{state.fieldErrors.displayName}</ErrMsg>
        )}
        <Field
          label="密碼 *"
          name="password"
          type="password"
          placeholder="至少 8 字元"
        />
        {!state.ok && state.fieldErrors?.password && (
          <ErrMsg>{state.fieldErrors.password}</ErrMsg>
        )}
        {!state.ok && state.error && (
          <p className="text-red-600 text-sm">{state.error}</p>
        )}
        {state.ok && (
          <p className="text-green-700 text-sm font-medium">{state.message}</p>
        )}
        <ModalFooter onClose={onClose} pending={pending} />
      </form>
    </ModalShell>
  );
}

function EditModal({
  admin,
  onClose,
}: {
  admin: AdminRow;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    updateAdminAction.bind(null, admin.id),
    initial,
  );
  if (state.ok) setTimeout(onClose, 600);

  return (
    <ModalShell title={`編輯：${admin.username}`} onClose={onClose}>
      <form action={action} className="space-y-4">
        <Field
          label="姓名 *"
          name="displayName"
          defaultValue={admin.displayName}
        />
        {!state.ok && state.fieldErrors?.displayName && (
          <ErrMsg>{state.fieldErrors.displayName}</ErrMsg>
        )}
        {!state.ok && state.error && (
          <p className="text-red-600 text-sm">{state.error}</p>
        )}
        {state.ok && (
          <p className="text-green-700 text-sm font-medium">{state.message}</p>
        )}
        <ModalFooter onClose={onClose} pending={pending} />
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({
  admin,
  onClose,
}: {
  admin: AdminRow;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    resetAdminPasswordAction.bind(null, admin.id),
    initial,
  );
  if (state.ok) setTimeout(onClose, 600);

  return (
    <ModalShell title={`重設「${admin.username}」的密碼`} onClose={onClose}>
      <form action={action} className="space-y-4">
        <Field
          label="新密碼 *"
          name="password"
          type="password"
          placeholder="至少 8 字元"
        />
        {!state.ok && state.fieldErrors?.password && (
          <ErrMsg>{state.fieldErrors.password}</ErrMsg>
        )}
        {!state.ok && state.error && (
          <p className="text-red-600 text-sm">{state.error}</p>
        )}
        {state.ok && (
          <p className="text-green-700 text-sm font-medium">{state.message}</p>
        )}
        <ModalFooter onClose={onClose} pending={pending} />
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="input-base"
      />
    </label>
  );
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-red-600 text-sm -mt-3">{children}</p>;
}

function ModalFooter({
  onClose,
  pending,
}: {
  onClose: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="btn-secondary !min-h-10 !text-sm"
      >
        取消
      </button>
      <button
        type="submit"
        disabled={pending}
        className="btn-primary !min-h-10 !text-sm"
      >
        {pending ? "處理中..." : "送出"}
      </button>
    </div>
  );
}
