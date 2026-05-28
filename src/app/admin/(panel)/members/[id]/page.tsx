import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import {
  getMemberById,
  getPassbookSignedUrl,
} from "@/data/admin/members";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { MemberBasicForm } from "./member-basic-form";
import { MemberBalanceForm } from "./member-balance-form";
import { PassbookViewer } from "./passbook-viewer";
import { DeleteMemberButton } from "./delete-member-button";

type Params = Promise<{ id: string }>;

export const metadata = { title: "會員詳細 ｜ 後台" };

export default function AdminMemberDetailPage({ params }: { params: Params }) {
  return (
    <div className="space-y-5">
      <Link
        href="/admin/members"
        className="inline-flex items-center text-slate-600 hover:text-slate-900 text-sm font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        返回會員列表
      </Link>

      <Suspense fallback={<div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />}>
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
      <header className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center gap-4">
        {m.lineAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.lineAvatarUrl}
            alt=""
            className="w-16 h-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-slate-200" />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 truncate">
            {m.name || m.lineDisplay || "未填寫"}
          </h1>
          <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span>LINE：{m.lineDisplay ?? "—"}</span>
            <span>
              LINE ID：
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
                {m.lineUserId}
              </code>
            </span>
            <span>註冊：{formatDateTime(m.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/transactions?member=${m.id}`}
            className="btn-secondary !min-h-10 !text-sm"
          >
            查看交易
          </Link>
          <DeleteMemberButton memberId={m.id} name={m.name ?? m.lineDisplay ?? ""} />
        </div>
      </header>

      {/* 餘額卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Pill label="總收益金額" value={formatCurrency(m.totalEarned)} />
        <Pill label="待提領金額" value={formatCurrency(m.pending)} tone="brand" />
        <Pill label="已提領金額" value={formatCurrency(m.withdrawn)} />
        <Pill label="鎖定金額" value={formatCurrency(m.locked)} tone="muted" hint="審核中" />
      </div>

      {/* 基本資料 + 銀行 */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="基本與銀行資料">
          <MemberBasicForm member={m} />
        </Card>
        <Card title="銀行存摺圖片" hint="憑證，不可更換">
          <Suspense fallback={<div className="h-60 bg-slate-100 rounded-xl animate-pulse" />}>
            <PassbookBlock storagePath={m.passbookUrl} />
          </Suspense>
        </Card>
      </div>

      {/* 餘額管理 */}
      <Card title="餘額管理" hint="僅供修正使用，所有變動應有對應的交易紀錄">
        <MemberBalanceForm member={m} />
      </Card>

      {/* 推薦關係 */}
      <Card title="推薦關係">
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
      </Card>
    </>
  );
}

async function PassbookBlock({ storagePath }: { storagePath: string | null }) {
  if (!storagePath) {
    return (
      <div className="py-16 text-center text-slate-500 bg-slate-50 rounded-xl">
        尚未上傳存摺圖片
      </div>
    );
  }
  const url = await getPassbookSignedUrl(storagePath);
  if (!url) {
    return (
      <div className="py-16 text-center text-red-600 bg-red-50 rounded-xl">
        無法取得圖片（請檢查 Storage 設定）
      </div>
    );
  }
  return <PassbookViewer src={url} />;
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <header className="px-5 pt-4 pb-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
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
        ? "bg-slate-50 border-slate-200 text-slate-500"
        : "bg-white border-slate-200 text-slate-900";
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-black mt-1 tabular-nums">{value}</div>
      {hint && <div className="text-xs mt-1 opacity-60">{hint}</div>}
    </div>
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
          highlight ? "text-brand-dark tracking-wider" : "text-slate-900"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
