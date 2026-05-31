import { Suspense } from "react";
import { listAllAnnouncements } from "@/data/announcements";
import { formatDateTime } from "@/lib/utils";
import {
  CreateAnnouncementButton,
  DeleteAnnouncementButton,
} from "./announcement-actions";
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

export const metadata = { title: "公告欄 ｜ 後台" };

export default function AdminAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-black text-slate-900">公告欄</h1>
          <p className="text-slate-500 mt-1 text-sm">
            管理會員首頁顯示的公告
          </p>
        </div>
        <CreateAnnouncementButton />
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <AnnouncementTable />
      </Suspense>
    </div>
  );
}

async function AnnouncementTable() {
  const rows = await listAllAnnouncements();

  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-hairline overflow-hidden">
        <EmptyState title="尚無公告" description="點右上角「新增公告」建立第一則" />
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
              <TableHead className="text-center">標題</TableHead>
              <TableHead className="text-center">內容</TableHead>
              <TableHead className="text-center">發布時間</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-semibold text-ink">{a.title}</TableCell>
                <TableCell className="max-w-[420px] truncate text-slate-600">
                  {a.content}
                </TableCell>
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDateTime(a.createdAt)}
                </TableCell>
                <TableCell className="text-center">
                  <DeleteAnnouncementButton id={a.id} title={a.title} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 手機：卡片 */}
      <ul className="md:hidden space-y-3">
        {rows.map((a) => (
          <li
            key={a.id}
            className="bg-surface rounded-card border border-hairline shadow-premium-sm p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-ink">{a.title}</p>
              <DeleteAnnouncementButton id={a.id} title={a.title} />
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">
              {a.content}
            </p>
            <p className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-hairline p-8 space-y-3">
      <Skeleton className="h-6 w-48 rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded" />
      ))}
    </div>
  );
}
