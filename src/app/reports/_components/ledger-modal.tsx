"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createLedgerEntryAction,
  updateLedgerEntryAction,
  type LedgerFormState,
} from "@/actions/reports-ledger";
import type { LedgerEntry } from "@/data/reports/ledger";
import type { Department } from "@/data/reports/departments";
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

const initial: LedgerFormState = { ok: false };

export function NewLedgerEntryButton({
  departments,
}: {
  departments: Department[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        新增記錄
      </Button>
      <LedgerEntryModal
        departments={departments}
        open={open}
        setOpen={setOpen}
      />
    </>
  );
}

export function LedgerEntryModal({
  entry,
  departments,
  open,
  setOpen,
}: {
  entry?: LedgerEntry;
  departments: Department[];
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const isEdit = !!entry;
  const action = isEdit
    ? updateLedgerEntryAction.bind(null, entry!.id)
    : createLedgerEntryAction;
  const [state, formAction, pending] = useActionState(action, initial);

  const [acked, setAcked] = useState(false);
  if (state.ok && !acked) {
    setAcked(true);
    setOpen(false);
  } else if (!state.ok && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "已儲存");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯收支記錄" : "新增收支記錄"}</DialogTitle>
        </DialogHeader>

        <Alert variant="warning">
          收入請填正數，支出請填正數（系統會分別記在收入/支出欄）
        </Alert>

        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="日期 *"
              name="entryDate"
              type="date"
              defaultValue={
                entry?.entryDate ?? new Date().toISOString().slice(0, 10)
              }
            />
            <div className="space-y-2">
              <Label htmlFor="departmentId">部門名稱 *</Label>
              <Select
                name="departmentId"
                defaultValue={entry?.departmentId ?? ""}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <FieldError state={state} field="entryDate" />
          <FieldError state={state} field="departmentId" />

          <Field
            label="車號/人名"
            name="carOrPerson"
            defaultValue={entry?.carOrPerson ?? ""}
          />
          <Field
            label="項目 *"
            name="item"
            defaultValue={entry?.item ?? ""}
            placeholder="如：油資、月票"
          />
          <FieldError state={state} field="item" />

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="收入"
              name="income"
              type="number"
              step="0.01"
              defaultValue={entry ? String(entry.income) : "0"}
            />
            <Field
              label="支出"
              name="expense"
              type="number"
              step="0.01"
              defaultValue={entry ? String(entry.expense) : "0"}
            />
          </div>
          <FieldError state={state} field="income" />
          <FieldError state={state} field="expense" />

          <Field label="備註1" name="note1" defaultValue={entry?.note1 ?? ""} />
          <Field label="備註2" name="note2" defaultValue={entry?.note2 ?? ""} />

          {!state.ok && state.error ? (
            <Alert variant="danger">{state.error}</Alert>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "儲存中..." : isEdit ? "儲存變更" : "新增"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  step,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  step?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        name={name}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputSize="sm"
      />
    </div>
  );
}

function FieldError({
  state,
  field,
}: {
  state: LedgerFormState;
  field: string;
}) {
  if (state.ok) return null;
  const msg = state.fieldErrors?.[field];
  if (!msg) return null;
  return <p className="text-money text-sm font-medium -mt-2">{msg}</p>;
}
