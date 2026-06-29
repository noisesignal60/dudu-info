import { Suspense } from "react";
import { getMyDownline } from "@/data/stats";
import { SectionCard } from "@/ui/section-card";
import { EmptyState } from "@/ui/empty-state";
import { Skeleton } from "@/ui/skeleton";
import { BackLink } from "../_components/back-link";
import { MemberRow } from "../_components/member-row";

export const metadata = { title: "我的網絡夥伴 ｜ 嘟嘟資訊網" };

export default function NetworkPage() {
  return (
    <div className="space-y-5">
      <BackLink />
      <Suspense fallback={<Skeleton className="h-60 rounded-card" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const downline = await getMyDownline();
  const levels = [...new Set(downline.map((m) => m.level))].sort(
    (a, b) => a - b
  );

  return (
    <SectionCard
      title="我的網絡夥伴"
      subtitle={`您往下各層級的所有夥伴，共 ${downline.length} 人`}
    >
      {downline.length === 0 ? (
        <EmptyState
          title="您的網絡目前還沒有夥伴"
          description="從推薦第一位朋友開始建立您的網絡！"
        />
      ) : (
        <div className="space-y-5">
          {levels.map((lv) => {
            const members = downline.filter((m) => m.level === lv);
            return (
              <div key={lv}>
                <p className="eyebrow text-slate-500 mb-1">
                  {lv === 1 ? "第 1 層（直接推薦）" : `第 ${lv} 層`}
                  <span className="ml-1 text-slate-400">· {members.length} 人</span>
                </p>
                <ul className="divide-y divide-hairline">
                  {members.map((m) => (
                    <MemberRow key={m.id} member={m} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
