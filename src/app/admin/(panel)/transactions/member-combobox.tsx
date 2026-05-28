"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { searchMembersAction } from "@/actions/admin-transactions";
import type { MemberOption } from "@/data/admin/transactions";

export function MemberCombobox({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  const id = useId();
  const [q, setQ] = useState("");
  const [options, setOptions] = useState<MemberOption[]>([]);
  const [selected, setSelected] = useState<MemberOption | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      start(async () => {
        if (ctrl.signal.aborted) return;
        const list = await searchMembersAction(q);
        if (!ctrl.signal.aborted) setOptions(list);
      });
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="block" ref={boxRef}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && " *"}
      </label>
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={selected ? selected.label : q}
          onChange={(e) => {
            if (selected) setSelected(null);
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="搜尋姓名 / LINE 顯示名 / 推薦碼 / 電話"
          className="input-base pl-9"
        />
      </div>
      {open && (
        <ul className="mt-1 border border-slate-200 bg-white rounded-xl shadow-lg max-h-72 overflow-y-auto z-20 relative">
          {pending && (
            <li className="px-3 py-2 text-sm text-slate-500">搜尋中…</li>
          )}
          {!pending && options.length === 0 && (
            <li className="px-3 py-3 text-sm text-slate-500">沒有符合的會員</li>
          )}
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(o);
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm"
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
