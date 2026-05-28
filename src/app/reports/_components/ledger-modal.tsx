"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import {
  createLedgerEntryAction,
  updateLedgerEntryAction,
  type LedgerFormState,
} from "@/actions/reports-ledger";
import type { LedgerEntry } from "@/data/reports/ledger";
import type { Department } from "@/data/reports/departments";

const initial: LedgerFormState = { ok: false };

export function NewLedgerEntryButton({
  departments,
}: {
  departments: Department[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary !min-h-10 !text-sm"
      >
        <Plus className="w-4 h-4" />
        新增記錄
      </button>
      {open && (
        <LedgerEntryModal
          departments={departments}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function LedgerEntryModal({
  entry,
  departments,
  onClose,
}: {
  entry?: LedgerEntry;
  departments: Department[];
  onClose: () => void;
}) {
  const isEdit = !!entry;
  const action = isEdit
    ? updateLedgerEntryAction.bind(null, entry!.id)
    : createLedgerEntryAction;
  const [state, formAction, pending] = useActionState(action, initial);
  if (state.ok) setTimeout(onClose, 600);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {isEdit ? "編輯收支記錄" : "新增收支記錄"}
        </h3>
        <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-4">
          收入請填正數，支出請填正數（系統會分別記在收入/支出欄）
        </p>

        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="日期 *"
              name="entryDate"
              type="date"
              defaultValue={entry?.entryDate ?? new Date().toISOString().slice(0, 10)}
            />
            <FieldSelect
              label="部門名稱 *"
              name="departmentId"
              defaultValue={entry?.departmentId ?? ""}
              options={[
                { value: "", label: "請選擇" },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
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

          <Field
            label="備註1"
            name="note1"
            defaultValue={entry?.note1 ?? ""}
          />
          <Field
            label="備註2"
            name="note2"
            defaultValue={entry?.note2 ?? ""}
          />

          {state.ok ? (
            <p className="text-sm text-green-700 font-medium">{state.message}</p>
          ) : state.error ? (
            <p className="text-sm text-red-600">{state.error}</p>
          ) : null}

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
              {pending ? "儲存中..." : isEdit ? "儲存變更" : "新增"}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </span>
      <input
        type={type}
        name={name}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input-base"
      />
    </label>
  );
}

function FieldSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </span>
      <select name={name} defaultValue={defaultValue} className="input-base">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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
  return <p className="text-red-600 text-xs -mt-2">{msg}</p>;
}

