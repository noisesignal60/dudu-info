import { adminLogoutAction } from "@/actions/admin-auth";
import type { AdminSessionData } from "@/lib/admin-session";
import { LogOut, UserCircle2 } from "lucide-react";

export function AdminTopbar({ admin }: { admin: AdminSessionData | null }) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-16">
        <div className="md:hidden w-10" />
        <div className="flex-1" />

        {admin && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {admin.displayName}
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-none">
                {admin.username}
              </p>
            </div>
            <UserCircle2 className="w-9 h-9 text-slate-400" />
            <form action={adminLogoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                登出
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
