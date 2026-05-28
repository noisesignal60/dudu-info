"use client";

import { useActionState, useState } from "react";
import {
  updateCommissionAction,
  type CommissionFormState,
} from "@/actions/admin-commission";
import type { CommissionSettings } from "@/data/admin/commission";
import { formatCurrency } from "@/lib/utils";

const LEVELS = ["A", "B", "C", "D", "E"] as const;
type Level = (typeof LEVELS)[number];

const initial: CommissionFormState = { ok: false };
const SAMPLE = 1000;

export function CommissionForm({
  current,
}: {
  current: CommissionSettings | null;
}) {
  const [state, action, pending] = useActionState(updateCommissionAction, initial);

  const [rates, setRates] = useState<Record<Level, string>>({
    A: current ? String(current.rateA) : "",
    B: current ? String(current.rateB) : "",
    C: current ? String(current.rateC) : "",
    D: current ? String(current.rateD) : "",
    E: current ? String(current.rateE) : "",
  });
  const [newBonus, setNewBonus] = useState<string>(
    current ? String(current.newBonus) : "0",
  );

  function rateNum(lv: Level): number {
    const n = Number(rates[lv]);
    return Number.isFinite(n) ? n : 0;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <form action={action} className="lg:col-span-2 space-y-5">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">五級分潤比例</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LEVELS.map((lv) => (
              <label key={lv} className="block">
                <span className="block text-sm font-bold text-slate-700 mb-1">
                  {lv} 級 比例
                </span>
                <div className="relative">
                  <input
                    type="number"
                    name={`rate${lv}`}
                    step="0.01"
                    value={rates[lv]}
                    onChange={(e) =>
                      setRates((p) => ({ ...p, [lv]: e.target.value }))
                    }
                    className="input-base pr-10"
                    placeholder="0"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    %
                  </span>
                </div>
                <FieldError state={state} field={`rate${lv}`} />
              </label>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">新會員獎勵金</h2>
          <label className="block">
            <span className="block text-sm font-medium text-slate-600 mb-1">
              金額（元）
            </span>
            <input
              type="number"
              name="newBonus"
              step="1"
              value={newBonus}
              onChange={(e) => setNewBonus(e.target.value)}
              className="input-base"
              required
            />
            <FieldError state={state} field="newBonus" />
          </label>
        </section>

        {state.ok ? (
          <p className="text-sm text-green-700 font-medium">{state.message}</p>
        ) : state.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full sm:w-auto"
        >
          {pending ? "儲存中..." : "儲存設定"}
        </button>
      </form>

      <aside className="lg:col-span-1">
        <div className="bg-brand-soft border border-brand/30 rounded-2xl p-5 sticky top-4">
          <h3 className="font-bold text-brand-dark mb-1">即時計算範例</h3>
          <p className="text-sm text-brand-dark/80 mb-4">
            基於 {formatCurrency(SAMPLE)} 的範例
          </p>
          <ul className="space-y-2">
            {LEVELS.map((lv) => {
              const amount = (SAMPLE * rateNum(lv)) / 100;
              return (
                <li
                  key={lv}
                  className="flex items-center justify-between text-base"
                >
                  <span className="font-bold text-slate-700">{lv} 級獲得</span>
                  <span className="font-black text-brand-dark tabular-nums">
                    {formatCurrency(amount)}
                  </span>
                </li>
              );
            })}
            <li className="border-t border-brand/30 pt-2 mt-2 flex items-center justify-between text-base">
              <span className="font-bold text-slate-700">新會員獎勵</span>
              <span className="font-black text-brand-dark tabular-nums">
                {formatCurrency(Number(newBonus) || 0)}
              </span>
            </li>
          </ul>
          <p className="text-xs text-brand-dark/60 mt-4 leading-5">
            ※ 範例僅供視覺驗算，實際分潤發放邏輯由業務流程決定（本期未自動觸發）
          </p>
        </div>
      </aside>
    </div>
  );
}

function FieldError({
  state,
  field,
}: {
  state: CommissionFormState;
  field: string;
}) {
  if (state.ok) return null;
  const msg = state.fieldErrors?.[field];
  if (!msg) return null;
  return <p className="text-red-600 text-xs mt-1">{msg}</p>;
}
