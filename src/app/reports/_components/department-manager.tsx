"use client";

import { useState, useTransition, useActionState } from "react";
import { Plus, X } from "lucide-react";
import {
  createDepartmentAction,
  renameDepartmentAction,
  deleteDepartmentAction,
  type DeptFormState,
} from "@/actions/reports-departments";
import type { Department } from "@/data/reports/departments";

const initial: DeptFormState = { ok: false };

export function DepartmentManagerButton({
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
        className="btn-secondary !min-h-10 !text-sm"
      >
        編輯部門
      </button>
      {open && (
        <DeptModal departments={departments} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function DeptModal({
  departments,
  onClose,
}: {
  departments: Department[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createDepartmentAction, initial);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">編輯部門</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 新增 */}
        <form action={action} className="flex gap-2 mb-5">
          <input
            type="text"
            name="name"
            className="input-base flex-1"
            placeholder="新增部門名稱"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="btn-primary !min-h-10 !text-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </form>
        {!state.ok && state.fieldErrors?.name && (
          <p className="text-red-600 text-sm -mt-3 mb-3">
            {state.fieldErrors.name}
          </p>
        )}
        {!state.ok && state.error && (
          <p className="text-red-600 text-sm -mt-3 mb-3">{state.error}</p>
        )}

        {/* 列表（inline rename + 刪除）*/}
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {departments.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">
              尚無部門 — 先新增第一個
            </p>
          ) : (
            departments.map((d) => <DeptRow key={d.id} dept={d} />)
          )}
        </div>
      </div>
    </div>
  );
}

function DeptRow({ dept }: { dept: Department }) {
  const [name, setName] = useState(dept.name);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onBlur() {
    if (name.trim() === dept.name) return;
    start(async () => {
      const res = await renameDepartmentAction(dept.id, name);
      if (!res.ok) {
        setMsg(res.error ?? "更新失敗");
        setName(dept.name);
      } else {
        setMsg("✓ 已儲存");
        setTimeout(() => setMsg(null), 1500);
      }
    });
  }

  function onDelete() {
    if (!window.confirm(`確定刪除部門「${dept.name}」？`)) return;
    start(async () => {
      const res = await deleteDepartmentAction(dept.id);
      if (!res.ok) alert(res.error ?? "刪除失敗");
    });
  }

  return (
    <div className="flex items-center gap-2 group">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={onBlur}
        disabled={pending}
        className="input-base !min-h-10 !text-sm flex-1"
      />
      {msg && <span className="text-xs text-slate-500 shrink-0">{msg}</span>}
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-2 transition"
        aria-label="刪除"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
