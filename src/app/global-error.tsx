"use client";

import { useEffect, type CSSProperties } from "react";

const buttonStyle: CSSProperties = {
  minHeight: "3rem",
  padding: "0 1.5rem",
  borderRadius: ".75rem",
  border: "none",
  background: "#1E293B",
  color: "#fff",
  fontWeight: 700,
  fontSize: "1.125rem",
  cursor: "pointer",
};

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
          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              flexWrap: "wrap",
              gap: ".75rem",
              justifyContent: "center",
            }}
          >
            <button onClick={reset} style={buttonStyle}>
              重新嘗試
            </button>
            {/*
              reset() 只會重新 render，網頁裡的舊程式碼還留著。
              網站剛更新時，舊分頁會拿著過期的程式碼一直失敗，
              只有整頁重新載入才救得回來。
            */}
            <button
              onClick={() => window.location.reload()}
              style={{
                ...buttonStyle,
                background: "#fff",
                color: "#0F172A",
                border: "1px solid #CBD5E1",
              }}
            >
              重新整理頁面
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
