import { Suspense } from "react";
import { getNetworkTree } from "@/data/admin/network";
import { NetworkTreeView } from "./tree-view";

export const metadata = { title: "網絡樹狀圖 ｜ 後台" };

export default function NetworkPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">網絡樹狀圖</h1>
        <p className="text-slate-500 mt-1 text-sm">
          視覺化會員推薦關係，點擊節點可前往會員詳情
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
        }
      >
        <TreeBlock />
      </Suspense>
    </div>
  );
}

async function TreeBlock() {
  const { roots, totalMembers } = await getNetworkTree();
  return <NetworkTreeView roots={roots} totalMembers={totalMembers} />;
}
