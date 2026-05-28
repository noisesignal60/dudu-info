import { Suspense } from "react";
import { listDepartments } from "@/data/reports/departments";
import { BatchEntryForm } from "./batch-entry-form";

export const metadata = { title: "新增日報表 ｜ 帳簿系統" };

export default function ReportsNewPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-900">新增日報表</h1>
        <p className="text-slate-500 mt-1 text-sm">
          一次輸入多筆記錄；支援暫存與復原/重做
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
        }
      >
        <FormBlock />
      </Suspense>
    </div>
  );
}

async function FormBlock() {
  const departments = await listDepartments();
  return <BatchEntryForm departments={departments} />;
}
