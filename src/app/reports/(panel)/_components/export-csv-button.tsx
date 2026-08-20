"use client";

import { useTransition } from "react";
import { Button } from "@/ui/button";
import { exportLedgerCsvAction } from "@/actions/reports-ledger";

export function ExportCsvButton({
  filters,
}: {
  filters: {
    departmentId?: string;
    year?: number;
    month?: number;
    quarter?: number;
    /** 自訂區間起日（含當日）ISO YYYY-MM-DD；與 year 互斥 */
    from?: string;
    /** 自訂區間訖日（含當日）ISO YYYY-MM-DD；與 year 互斥 */
    to?: string;
    q?: string;
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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "匯出中..." : "匯出 CSV"}
    </Button>
  );
}
