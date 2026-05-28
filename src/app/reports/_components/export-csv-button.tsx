"use client";

import { Download } from "lucide-react";
import { useTransition } from "react";
import { exportLedgerCsvAction } from "@/actions/reports-ledger";

export function ExportCsvButton({
  filters,
}: {
  filters: {
    departmentId?: string;
    year?: number;
    month?: number;
    quarter?: number;
  };
}) {
  const [pending, start] = useTransition();

  function onClick() {
    start(async () => {
      const res = await exportLedgerCsvAction(filters);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="btn-secondary !min-h-10 !text-sm"
    >
      <Download className="w-4 h-4" />
      {pending ? "匯出中..." : "匯出 CSV"}
    </button>
  );
}
