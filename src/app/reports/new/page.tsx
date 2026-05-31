import { Suspense } from "react";
import { Skeleton } from "@/ui/skeleton";
import { listDepartments } from "@/data/reports/departments";
import { BatchEntryForm } from "./batch-entry-form";

export const metadata = { title: "新增日報表 ｜ 帳簿系統" };

export default function ReportsNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-black text-slate-900">新增日報表</h1>
        <p className="text-slate-500 mt-1 text-sm">
          一次輸入多筆記錄；支援暫存與復原/重做
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <FormBlock />
      </Suspense>
    </div>
  );
}

async function FormBlock() {
  const departments = await listDepartments();
  return <BatchEntryForm departments={departments} />;
}
