"use client";

import { useState, useActionState } from "react";
import { Plus, Banknote, Gift, Pencil, Download } from "lucide-react";
import {
  createGeneralTransactionAction,
  manualWithdrawalAction,
  newMemberRewardAction,
  editTransactionAction,
  exportTransactionsCsvAction,
  type TxFormState,
} from "@/actions/admin-transactions";
import type { AdminTxRow } from "@/data/admin/transactions";
import { MemberCombobox } from "./member-combobox";

const initial: TxFormState = { ok: false };

export function TxToolbar({
  filters,
}: {
  filters: { kind?: string; memberId?: string; from?: string; to?: string };
}) {
  const [mode, setMode] = useState<"none" | "create" | "withdraw" | "reward">(
    "none",
  );

  async function onExport() {
    const res = await exportTransactionsCsvAction(filters);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("create")}
          className="btn-primary !min-h-10 !text-sm"
        >
          <Plus className="w-4 h-4" />
          創建新交易
        </button>
        <button
          type="button"
          onClick={() => setMode("withdraw")}
          className="btn-secondary !min-h-10 !text-sm"
        >
          <Banknote className="w-4 h-4" />
          手動提領
        </button>
        <button
          type="button"
          onClick={() => setMode("reward")}
          className="btn-secondary !min-h-10 !text-sm"
        >
          <Gift className="w-4 h-4" />
          新帳號獎勵
        </button>
        <button
          type="button"
          onClick={onExport}
          className="btn-secondary !min-h-10 !text-sm"
        >
          <Download className="w-4 h-4" />
          匯出 CSV
        </button>
      </div>

      {mode === "create" && <CreateModal onClose={() => setMode("none")} />}
      {mode === "withdraw" && <WithdrawModal onClose={() => setMode("none")} />}
      {mode === "reward" && <RewardModal onClose={() => setMode("none")} />}
    </>
  );
}

export function EditTxButton({ tx }: { tx: AdminTxRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-brand-dark hover:text-brand font-semibold"
      >
        <Pencil className="w-4 h-4" />
        編輯
      </button>
      {open && <EditModal tx={tx} onClose={() => setOpen(false)} />}
    </>
  );
}

// ──── Modal shells ───────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(
    createGeneralTransactionAction,
    initial,
  );
  if (state.ok) setTimeout(onClose, 700);

  return (
    <Shell title="創建新交易" onClose={onClose}>
      <form action={action} className="space-y-4">
        <MemberCombobox name="memberId" label="主要對象（會員）" required />
        <FieldError state={state} field="memberId" />

        <Field
          label="交易總金額 *"
          name="amount"
          type="number"
          step="0.01"
          placeholder="正數為收入，負數為支出"
        />
        <FieldError state={state} field="amount" />

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">
            類型
          </span>
          <select name="kind" defaultValue="commission" className="input-base">
            <option value="commission">分潤</option>
            <option value="adjust">手動調整</option>
          </select>
        </label>

        <Field label="交易描述" name="description" placeholder="選填" />

        <FormMsg state={state} />
        <Footer onClose={onClose} pending={pending} />
      </form>
    </Shell>
  );
}

function WithdrawModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(manualWithdrawalAction, initial);
  if (state.ok) setTimeout(onClose, 700);

  return (
    <Shell title="手動提領" onClose={onClose}>
      <form action={action} className="space-y-4">
        <MemberCombobox name="memberId" label="選擇用戶" required />
        <FieldError state={state} field="memberId" />

        <Field
          label="提領金額 *"
          name="amount"
          type="number"
          step="0.01"
          placeholder="必須 ≤ 會員的待領取金額"
        />
        <FieldError state={state} field="amount" />

        <Field label="提領備註" name="note" placeholder="選填" />

        <FormMsg state={state} />
        <Footer onClose={onClose} pending={pending} />
      </form>
    </Shell>
  );
}

function RewardModal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(newMemberRewardAction, initial);
  if (state.ok) setTimeout(onClose, 700);

  return (
    <Shell title="新帳號申請通過獎勵" onClose={onClose}>
      <form action={action} className="space-y-4">
        <MemberCombobox name="memberId" label="新用戶" required />
        <FieldError state={state} field="memberId" />

        <Field
          label="獎勵金額 *"
          name="amount"
          type="number"
          step="0.01"
        />
        <FieldError state={state} field="amount" />

        <Field label="獎勵描述" name="description" placeholder="選填" />

        <FormMsg state={state} />
        <Footer onClose={onClose} pending={pending} />
      </form>
    </Shell>
  );
}

function EditModal({
  tx,
  onClose,
}: {
  tx: AdminTxRow;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    editTransactionAction.bind(null, tx.id),
    initial,
  );
  if (state.ok) setTimeout(onClose, 700);

  return (
    <Shell title={`編輯交易：${tx.title}`} onClose={onClose}>
      <form action={action} className="space-y-4">
        <Field
          label="交易金額 *"
          name="amount"
          type="number"
          step="0.01"
          defaultValue={String(tx.amount)}
        />
        <FieldError state={state} field="amount" />

        <Field
          label="交易描述"
          name="description"
          defaultValue={tx.description ?? ""}
        />

        <FormMsg state={state} />
        <Footer onClose={onClose} pending={pending} />
      </form>
    </Shell>
  );
}

// ──── Primitives ─────────────────────────────────────────────

function Shell({
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
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 my-8"
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
  step,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
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
        step={step}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="input-base"
      />
    </label>
  );
}

function FieldError({
  state,
  field,
}: {
  state: TxFormState;
  field: string;
}) {
  if (state.ok) return null;
  const msg = state.fieldErrors?.[field];
  if (!msg) return null;
  return <p className="text-red-600 text-sm -mt-3">{msg}</p>;
}

function FormMsg({ state }: { state: TxFormState }) {
  if (state.ok)
    return (
      <p className="text-sm text-green-700 font-medium">{state.message}</p>
    );
  if (state.error)
    return <p className="text-sm text-red-600">{state.error}</p>;
  return null;
}

function Footer({
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
