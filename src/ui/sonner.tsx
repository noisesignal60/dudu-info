"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * 全站單一 Toast 出口（掛在 root layout）。Server Action 成功後由 client 表單呼叫
 * toast.success(...) / toast.error(...)，取代過去 inline 的 text-green-700 訊息。
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-card !border !border-hairline !bg-surface !text-ink !shadow-premium !text-base !font-sans",
          title: "!font-semibold",
          description: "!text-slate-500",
          actionButton: "!bg-primary !text-primary-foreground !rounded-lg",
          cancelButton: "!bg-secondary !text-ink !rounded-lg",
          error: "!text-money",
          success: "!text-positive",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
