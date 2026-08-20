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
        description="系統暫時無法處理您的請求。可以先重新嘗試；如果一直失敗，請重新整理頁面。"
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="touch" onClick={reset}>
              重新嘗試
            </Button>
            {/*
              reset() 只會重新 render，網頁裡的舊程式碼還留著。
              網站剛更新時，舊分頁會拿著過期的程式碼一直失敗，
              只有整頁重新載入才救得回來。
            */}
            <Button
              size="touch"
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              重新整理頁面
            </Button>
          </div>
        }
      />
    </div>
  );
}
