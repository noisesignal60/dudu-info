"use client";

import { useEffect } from "react";

/**
 * 取代整個 root layout（含 root error），故自帶 html/body 且用 inline style，
 * 不依賴 globals.css 是否載入。僅在最頂層 render 例外時觸發。
 */
export default function GlobalError({
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
    <html lang="zh-Hant">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          background: "#F8FAFC",
          color: "#0F172A",
          fontFamily:
            "system-ui, -apple-system, 'Noto Sans TC', sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "24rem" }}>
          <p style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
            系統發生錯誤
          </p>
          <p style={{ marginTop: ".5rem", color: "#64748b", fontSize: ".95rem" }}>
            請重新整理頁面，若問題持續請稍後再試。
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              minHeight: "3rem",
              padding: "0 1.5rem",
              borderRadius: ".75rem",
              border: "none",
              background: "#1E293B",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.125rem",
              cursor: "pointer",
            }}
          >
            重新嘗試
          </button>
        </div>
      </body>
    </html>
  );
}
