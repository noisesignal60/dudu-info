"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/ui/button";
import { exportMembersCsvAction } from "@/actions/admin-members";

export function MembersExportCsvButton() {
  const [pending, start] = useTransition();
  const searchParams = useSearchParams();

  function onClick() {
    const q = searchParams.get("q") ?? "";
    start(async () => {
      const res = await exportMembersCsvAction({ q });
      if (!res.ok) {
        toast.error(res.error);
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
      {pending ? "匯出中…" : "匯出 CSV"}
    </Button>
  );
}
