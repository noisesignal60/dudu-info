import { Suspense } from "react";
import { getMyDownline } from "@/data/stats";
import { SectionCard } from "@/ui/section-card";
import { EmptyState } from "@/ui/empty-state";
import { Skeleton } from "@/ui/skeleton";
import { BackLink } from "../_components/back-link";
import { MemberRow } from "../_components/member-row";

export const metadata = { title: "我的推薦夥伴 ｜ 嘟嘟資訊網" };

export default function ReferralsPage() {
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
  const members = (await getMyDownline()).filter((m) => m.level === 1);
  return (
    <SectionCard
      title="我的推薦夥伴"
      subtitle={`您直接推薦加入的夥伴，共 ${members.length} 人`}
    >
      {members.length === 0 ? (
        <EmptyState
          title="目前還沒有推薦的夥伴"
          description="分享您的推薦碼，邀請朋友一起加入吧！"
        />
      ) : (
        <ul className="divide-y divide-hairline">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
