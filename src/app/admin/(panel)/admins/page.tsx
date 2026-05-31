import { Suspense } from "react";
import { listAdmins } from "@/data/admin/admins";
import { getCurrentAdmin } from "@/lib/admin-session";
import { formatDateTime } from "@/lib/utils";
import { AdminListActions } from "./admin-list-actions";
import { Badge } from "@/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/ui/table";
import { EmptyState } from "@/ui/empty-state";
import { Skeleton } from "@/ui/skeleton";

export const metadata = { title: "管理員管理 ｜ 後台" };

export default function AdminAdminsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-slate-900">管理員管理</h1>
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

  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-hairline overflow-hidden">
        <EmptyState
          title="尚無管理員"
          description="第一位管理員需用 `npx tsx scripts/seed-admin.ts` 建立"
        />
      </div>
    );
  }

  return (
    <>
      {/* 桌機：表格 */}
      <div className="hidden md:block rounded-card border border-hairline overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>帳號</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>建立時間</TableHead>
              <TableHead>最後登入</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => {
              const isSelf = a.id === me?.adminId;
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <Badge variant="neutral" size="sm" className="font-mono">
                      {a.username}
                    </Badge>
                    {isSelf && (
                      <span className="ml-2 text-xs text-brand-dark font-bold">
                        （我）
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{a.displayName}</TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateTime(a.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                    {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "從未登入"}
                  </TableCell>
                  <TableCell>
                    {a.isActive ? (
                      <Badge variant="positive" size="sm">
                        啟用
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        停用
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <AdminListActions mode="row" admin={a} isSelf={isSelf} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 手機：卡片 */}
      <ul className="md:hidden space-y-3">
        {rows.map((a) => {
          const isSelf = a.id === me?.adminId;
          return (
            <li
              key={a.id}
              className="bg-surface rounded-card border border-hairline shadow-premium-sm p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm" className="font-mono">
                      {a.username}
                    </Badge>
                    {isSelf && (
                      <span className="text-xs text-brand-dark font-bold">
                        （我）
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-ink mt-1.5 truncate">
                    {a.displayName}
                  </p>
                </div>
                {a.isActive ? (
                  <Badge variant="positive" size="sm">
                    啟用
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    停用
                  </Badge>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt className="text-slate-500">建立時間</dt>
                <dd className="text-ink text-right text-xs">
                  {formatDateTime(a.createdAt)}
                </dd>
                <dt className="text-slate-500">最後登入</dt>
                <dd className="text-ink text-right text-xs">
                  {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : "從未登入"}
                </dd>
              </dl>

              <div className="flex justify-end border-t border-hairline pt-2">
                <AdminListActions mode="row" admin={a} isSelf={isSelf} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-hairline p-8 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded" />
      ))}
    </div>
  );
}
