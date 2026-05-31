import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getMemberById,
  getPassbookSignedUrl,
} from "@/data/admin/members";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/ui/card";
import { Alert } from "@/ui/alert";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
import { MemberBasicForm } from "./member-basic-form";
import { MemberBalanceForm } from "./member-balance-form";
import { PassbookViewer } from "./passbook-viewer";
import { DeleteMemberButton } from "./delete-member-button";

type Params = Promise<{ id: string }>;

export const metadata = { title: "會員詳細 ｜ 後台" };

export default function AdminMemberDetailPage({ params }: { params: Params }) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/members"
        className="inline-flex items-center text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        返回會員列表
      </Link>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <MemberDetail params={params} />
      </Suspense>
    </div>
  );
}

async function MemberDetail({ params }: { params: Params }) {
  const { id } = await params;
  const m = await getMemberById(id);
  if (!m) notFound();

  return (
    <>
      {/* 頂部：LINE 資訊 + 操作 */}
      <Card className="p-5 flex flex-wrap items-center gap-4">
        {m.lineAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.lineAvatarUrl}
            alt=""
            className="w-16 h-16 rounded-card object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-card bg-background" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-xl font-black text-ink truncate">
            {m.name || m.lineDisplay || "未填寫"}
          </h1>
          <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span>LINE：{m.lineDisplay ?? "—"}</span>
            <span>
              LINE ID：
              <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">
                {m.lineUserId}
              </code>
            </span>
            <span>註冊：{formatDateTime(m.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/admin/transactions?member=${m.id}`}>查看交易</Link>
          </Button>
          <DeleteMemberButton memberId={m.id} name={m.name ?? m.lineDisplay ?? ""} />
        </div>
      </Card>

      {/* 餘額卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Pill label="總收益金額" value={formatCurrency(m.totalEarned)} />
        <Pill label="待提領金額" value={formatCurrency(m.pending)} tone="brand" />
        <Pill label="已提領金額" value={formatCurrency(m.withdrawn)} />
        <Pill label="鎖定金額" value={formatCurrency(m.locked)} tone="muted" hint="審核中" />
      </div>

      {/* 基本資料 + 銀行 */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>基本與銀行資料</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberBasicForm member={m} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>銀行存摺圖片</CardTitle>
              <CardDescription>憑證，不可更換</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-60" />}>
              <PassbookBlock storagePath={m.passbookUrl} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* 餘額管理 */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>餘額管理</CardTitle>
            <CardDescription>僅供修正使用，所有變動應有對應的交易紀錄</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <MemberBalanceForm member={m} />
        </CardContent>
      </Card>

      {/* 推薦關係 */}
      <Card>
        <CardHeader>
          <CardTitle>推薦關係</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="我的推薦碼" value={m.referralCode} highlight />
            <Field
              label="上級"
              value={
                m.uplineName ? `${m.uplineName} (${m.uplineReferralCode})` : "—"
              }
            />
            <Field label="下包數" value={`${m.downlineCount} 人`} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

async function PassbookBlock({ storagePath }: { storagePath: string | null }) {
  if (!storagePath) {
    return (
      <EmptyState title="尚未上傳存摺圖片" />
    );
  }
  const url = await getPassbookSignedUrl(storagePath);
  if (!url) {
    return (
      <Alert variant="danger">無法取得圖片（請檢查 Storage 設定）</Alert>
    );
  }
  return <PassbookViewer src={url} />;
}

function Pill({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "brand" | "muted";
  hint?: string;
}) {
  const cls =
    tone === "brand"
      ? "bg-brand-soft border-brand/30 text-brand-dark"
      : tone === "muted"
        ? "bg-background text-slate-500"
        : "text-ink";
  return (
    <Card className={`p-4 ${cls}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-black mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-xs mt-1 opacity-60">{hint}</div>}
    </Card>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-0.5 font-semibold ${
          highlight ? "text-brand-dark tracking-wider" : "text-ink"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
