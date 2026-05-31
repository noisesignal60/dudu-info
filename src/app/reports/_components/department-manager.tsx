"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  createDepartmentAction,
  renameDepartmentAction,
  deleteDepartmentAction,
  type DeptFormState,
} from "@/actions/reports-departments";
import type { Department } from "@/data/reports/departments";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Alert } from "@/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";

const initial: DeptFormState = { ok: false };

export function DepartmentManagerButton({
  departments,
}: {
  departments: Department[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        編輯部門
      </Button>
      <DeptModal departments={departments} open={open} setOpen={setOpen} />
    </>
  );
}

function DeptModal({
  departments,
  open,
  setOpen,
}: {
  departments: Department[];
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [state, action, pending] = useActionState(
    createDepartmentAction,
    initial,
  );

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "已新增部門");
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯部門</DialogTitle>
        </DialogHeader>

        {/* 新增 */}
        <form action={action} className="flex gap-2">
          <Input
            type="text"
            name="name"
            inputSize="sm"
            className="flex-1"
            placeholder="新增部門名稱"
            required
          />
          <Button type="submit" size="sm" disabled={pending} className="shrink-0">
            新增
          </Button>
        </form>
        {!state.ok && state.fieldErrors?.name && (
          <p className="text-money text-sm font-medium -mt-2">
            {state.fieldErrors.name}
          </p>
        )}
        {!state.ok && state.error && (
          <Alert variant="danger">{state.error}</Alert>
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
      </DialogContent>
    </Dialog>
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
        setMsg("已儲存");
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
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={onBlur}
        disabled={pending}
        inputSize="sm"
        className="flex-1"
      />
      {msg && <span className="text-xs text-slate-500 shrink-0">{msg}</span>}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={pending}
        className="opacity-0 group-hover:opacity-100 text-money transition"
        aria-label="刪除"
      >
        <X />
      </Button>
    </div>
  );
}
