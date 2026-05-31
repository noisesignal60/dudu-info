/**
 * 產生銀行存摺浮水印的 SVG 字串。
 *
 * 同構（isomorphic）：不依賴 sharp、不帶 "server-only"，
 * 讓伺服器（`src/lib/watermark.ts` 以 sharp 合成）與前端（上傳預覽疊圖）
 * 共用同一份來源，確保預覽樣式與實際儲存一致。
 *
 * 形式：斜對角、半透明白字加深色描邊、4 列「嘟嘟資訊網 · 嘟嘟資訊網」平鋪。
 */
export function buildPassbookWatermarkSvg(width: number, height: number): string {
  const fontSize = Math.max(28, Math.round(width / 18));
  const text = "嘟嘟資訊網";
  const tiles = Array.from({ length: 4 })
    .map((_, i) => {
      const y = (i + 1) * (height / 5);
      return `<text x="50%" y="${y}" text-anchor="middle"
        font-family="Noto Sans TC, sans-serif" font-size="${fontSize}"
        fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.4)" stroke-width="1"
        transform="rotate(-25, ${width / 2}, ${y})">${text} · ${text}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${tiles}</svg>`;
}
