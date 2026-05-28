"use client";

import { useActionState } from "react";
import { adminLoginAction, type AdminLoginState } from "@/actions/admin-auth";

const initial: AdminLoginState = { ok: false };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initial);

  function err(k: string) {
    return state.ok === false ? state.fieldErrors?.[k] : undefined;
  }

  return (
    <form action={action} className="space-y-4">
      {state.ok === false && state.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="block mb-2 font-semibold text-slate-800">帳號</label>
        <input
          name="username"
          required
          autoFocus
          autoComplete="username"
          className="input-base"
          placeholder="admin"
        />
        {err("username") && (
          <p className="mt-1 text-sm text-money">{err("username")}</p>
        )}
      </div>

      <div>
        <label className="block mb-2 font-semibold text-slate-800">密碼</label>
        <input
          name="password"
          required
          type="password"
          autoComplete="current-password"
          className="input-base"
        />
        {err("password") && (
          <p className="mt-1 text-sm text-money">{err("password")}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl
                   transition disabled:opacity-50 mt-2"
      >
        {pending ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
