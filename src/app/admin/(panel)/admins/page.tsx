import { Suspense } from "react";
import { listAdmins } from "@/data/admin/admins";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatDateTime } from "@/lib/utils";
import { AdminListActions } from "./admin-list-actions";

export const metadata = { title: "管理員管理 ｜ 後台" };

export default function AdminAdminsPage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">管理員管理</h1>
          <p className="text-slate-500 mt-1 text-sm">
            管理後台與帳簿系統的管理員帳號
          </p>
        </div>
        <AdminListActions mode="create" />
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <AdminTable />
      </Suspense>
    </div>
  );
}

async function AdminTable() {
  const [rows, me] = await Promise.all([listAdmins(), getCurrentAdmin()]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {rows.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          尚無管理員 — 第一位管理員需用 `npx tsx scripts/seed-admin.ts` 建立
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <Th>帳號</Th>
                <Th>姓名</Th>
                <Th>建立時間</Th>
                <Th>最後登入</Th>
                <Th>狀態</Th>
                <Th align="right">操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => {
                const isSelf = a.id === me?.adminId;
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <Td>
                      <code className="text-sm font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        {a.username}
                      </code>
                      {isSelf && (
                        <span className="ml-2 text-xs text-brand-dark font-bold">
                          （我）
                        </span>
                      )}
                    </Td>
                    <Td>{a.displayName}</Td>
                    <Td className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(a.createdAt)}
                    </Td>
                    <Td className="text-xs text-slate-500 whitespace-nowrap">
                      {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "從未登入"}
                    </Td>
                    <Td>
                      {a.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                          啟用
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">
                          停用
                        </span>
                      )}
                    </Td>
                    <Td align="right">
                      <AdminListActions mode="row" admin={a} isSelf={isSelf} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-4 py-3 ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </td>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  );
}
