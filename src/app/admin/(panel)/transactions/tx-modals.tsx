"use client";

import { useState, useActionState, useEffect } from "react";
import { toast } from "sonner";
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
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";

const initial: TxFormState = { ok: false };

export function TxToolbar({
  filters,
}: {
  filters: { kind?: string; memberId?: string; from?: string; to?: string };
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);

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
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => setCreateOpen(true)}>
        創建新交易
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setWithdrawOpen(true)}>
        手動提領
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setRewardOpen(true)}>
        新帳號獎勵
      </Button>
      <Button variant="secondary" size="sm" onClick={onExport}>
        匯出 CSV
      </Button>

      <CreateModal open={createOpen} setOpen={setCreateOpen} />
      <WithdrawModal open={withdrawOpen} setOpen={setWithdrawOpen} />
      <RewardModal open={rewardOpen} setOpen={setRewardOpen} />
    </div>
  );
}

export function EditTxButton({ tx }: { tx: AdminTxRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-brand-dark hover:text-brand"
      >
        編輯
      </Button>
      <EditModal tx={tx} open={open} setOpen={setOpen} />
    </>
  );
}

// ──── Modals ─────────────────────────────────────────────────

function CreateModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [state, action, pending] = useActionState(
    createGeneralTransactionAction,
    initial,
  );
  const [acked, setAcked] = useState(false);
  if (state.ok && !acked) {
    setAcked(true);
    setOpen(false);
  } else if (!state.ok && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "完成");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>創建新交易</DialogTitle>
        </DialogHeader>
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

          <div className="space-y-1">
            <Label>類型</Label>
            <Select defaultValue="commission" name="kind">
              <SelectTrigger size="sm">
                <SelectValue placeholder="選擇類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commission">分潤</SelectItem>
                <SelectItem value="adjust">手動調整</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Field label="交易描述" name="description" placeholder="選填" />

          <FormMsg state={state} />
          <Footer onClose={() => setOpen(false)} pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [state, action, pending] = useActionState(manualWithdrawalAction, initial);
  const [acked, setAcked] = useState(false);
  if (state.ok && !acked) {
    setAcked(true);
    setOpen(false);
  } else if (!state.ok && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "完成");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>手動提領</DialogTitle>
        </DialogHeader>
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
          <Footer onClose={() => setOpen(false)} pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RewardModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [state, action, pending] = useActionState(newMemberRewardAction, initial);
  const [acked, setAcked] = useState(false);
  if (state.ok && !acked) {
    setAcked(true);
    setOpen(false);
  } else if (!state.ok && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "完成");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新帳號申請通過獎勵</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <MemberCombobox name="memberId" label="新用戶" required />
          <FieldError state={state} field="memberId" />

          <Field label="獎勵金額 *" name="amount" type="number" step="0.01" />
          <FieldError state={state} field="amount" />

          <Field label="獎勵描述" name="description" placeholder="選填" />

          <FormMsg state={state} />
          <Footer onClose={() => setOpen(false)} pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditModal({
  tx,
  open,
  setOpen,
}: {
  tx: AdminTxRow;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [state, action, pending] = useActionState(
    editTransactionAction.bind(null, tx.id),
    initial,
  );
  const [acked, setAcked] = useState(false);
  if (state.ok && !acked) {
    setAcked(true);
    setOpen(false);
  } else if (!state.ok && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "完成");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯交易：{tx.title}</DialogTitle>
        </DialogHeader>
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
          <Footer onClose={() => setOpen(false)} pending={pending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ──── Primitives ─────────────────────────────────────────────

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
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        step={step}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        inputSize="sm"
      />
    </div>
  );
}

function FieldError({ state, field }: { state: TxFormState; field: string }) {
  if (state.ok) return null;
  const msg = state.fieldErrors?.[field];
  if (!msg) return null;
  return <p className="text-money text-sm -mt-2">{msg}</p>;
}

function FormMsg({ state }: { state: TxFormState }) {
  if (!state.ok && state.error)
    return <Alert variant="danger">{state.error}</Alert>;
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
