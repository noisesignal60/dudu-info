"use client";

import { useActionState, useEffect, useState } from "react";
import { adminLoginAction, type AdminLoginState } from "@/actions/admin-auth";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";

const initial: AdminLoginState = { ok: false };

export function AdminLoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState(adminLoginAction, initial);

  // 鎖定倒數：依 action 回傳的 retryAfterSeconds 在前端逐秒遞減。
  const retryAfter = state.ok === false ? state.retryAfterSeconds : undefined;
  const [seenRetry, setSeenRetry] = useState<number | undefined>(undefined);
  const [remaining, setRemaining] = useState(0);

  // 收到新的鎖定回應時，於 render 期間同步重設倒數（React 官方「依 props 調整 state」模式）
  if (retryAfter !== seenRetry) {
    setSeenRetry(retryAfter);
    setRemaining(retryAfter && retryAfter > 0 ? retryAfter : 0);
  }

  // 單一計時器：每秒遞減，歸零即停（setState 只在 callback 內呼叫）
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const locked = remaining > 0;

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  return (
    <form action={action} className="space-y-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      {state.ok === false && state.error && (
        <Alert variant="danger">{state.error}</Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">帳號</Label>
        <Input
          id="username"
          name="username"
          required
          autoFocus
          autoComplete="username"
          placeholder="admin"
          aria-invalid={!!err("username")}
        />
        {err("username") && <p className="text-sm text-money">{err("username")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密碼</Label>
        <Input
          id="password"
          name="password"
          required
          type="password"
          autoComplete="current-password"
          aria-invalid={!!err("password")}
        />
        {err("password") && <p className="text-sm text-money">{err("password")}</p>}
      </div>

      <Button type="submit" disabled={pending || locked} className="w-full mt-2">
        {pending ? "登入中…" : locked ? `請稍候 ${remaining} 秒` : "登入"}
      </Button>
    </form>
  );
}
