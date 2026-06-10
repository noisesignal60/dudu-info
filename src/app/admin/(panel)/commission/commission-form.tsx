"use client";

import { useActionState, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  updateCommissionAction,
  type CommissionFormState,
} from "@/actions/admin-commission";
import type { CommissionSettings } from "@/data/admin/commission";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

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

  useEffect(() => {
    if (state.ok) toast.success(state.message ?? "已儲存");
  }, [state]);

  function rateNum(lv: Level): number {
    const n = Number(rates[lv]);
    return Number.isFinite(n) ? n : 0;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <form action={action} className="lg:col-span-2 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>五級分潤比例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LEVELS.map((lv) => (
                <div key={lv} className="space-y-1">
                  <Label htmlFor={`rate${lv}`}>{lv} 級 比例</Label>
                  <div className="relative">
                    <Input
                      id={`rate${lv}`}
                      type="number"
                      name={`rate${lv}`}
                      step="0.01"
                      inputSize="sm"
                      value={rates[lv]}
                      onChange={(e) =>
                        setRates((p) => ({ ...p, [lv]: e.target.value }))
                      }
                      className="pr-10"
                      placeholder="0"
                      aria-invalid={!state.ok && !!state.fieldErrors?.[`rate${lv}`]}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      %
                    </span>
                  </div>
                  <FieldError state={state} field={`rate${lv}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>新會員獎勵金</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Label htmlFor="newBonus">金額（元）</Label>
              <Input
                id="newBonus"
                type="number"
                name="newBonus"
                step="1"
                inputSize="sm"
                value={newBonus}
                onChange={(e) => setNewBonus(e.target.value)}
                aria-invalid={!state.ok && !!state.fieldErrors?.newBonus}
                required
              />
              <FieldError state={state} field="newBonus" />
            </div>
          </CardContent>
        </Card>

        {!state.ok && state.error ? (
          <Alert variant="danger">{state.error}</Alert>
        ) : null}

        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="w-full sm:w-auto"
        >
          {pending ? "儲存中..." : "儲存設定"}
        </Button>
      </form>

      <aside className="lg:col-span-1">
        <div className="bg-brand-soft border border-brand/30 rounded-2xl p-5 sticky top-20">
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
                  <span className="font-bold text-ink">{lv} 級獲得</span>
                  <span className="font-black text-brand-dark tabular-nums">
                    {formatCurrency(amount)}
                  </span>
                </li>
              );
            })}
            <li className="border-t border-brand/30 pt-2 mt-2 flex items-center justify-between text-base">
              <span className="font-bold text-ink">新會員獎勵</span>
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
  return <p className="text-money text-xs mt-1">{msg}</p>;
}
