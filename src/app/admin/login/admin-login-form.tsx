"use client";

import { useActionState } from "react";
import { adminLoginAction, type AdminLoginState } from "@/actions/admin-auth";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";

const initial: AdminLoginState = { ok: false };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initial);

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  return (
    <form action={action} className="space-y-4">
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

      <Button type="submit" disabled={pending} className="w-full mt-2">
        {pending ? "登入中…" : "登入"}
      </Button>
    </form>
  );
}
