"use client";

import { useEffect } from "react";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-svh place-items-center bg-background px-4">
      <EmptyState
        title="發生了一點問題"
        description="系統暫時無法處理您的請求，請稍後再試。"
        action={
          <Button size="touch" onClick={reset}>
            重新嘗試
          </Button>
        }
      />
    </div>
  );
}
