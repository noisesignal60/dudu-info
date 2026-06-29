import {
  WATERMARK_ADVANCE,
  WATERMARK_GLYPH_PATH,
  WATERMARK_REF_SIZE,
} from "./passbook-watermark-glyphs";

/**
 * 產生銀行存摺浮水印的 SVG 字串。
 *
 * 同構（isomorphic）：不依賴 sharp、不帶 "server-only"，
 * 讓伺服器（`src/lib/watermark.ts` 以 sharp 合成）與前端（上傳預覽疊圖）
 * 共用同一份來源，確保預覽樣式與實際儲存一致。
 *
 * 字樣以**向量路徑**（SVG <path>）輸出，不用 <text>／font-family：
 * sharp（librsvg）烘字時在無 CJK 字型的環境（Vercel serverless）不會變成「口口口」，
 * 且官方明載「Embedded SVG fonts are not supported」。路徑由
 * `scripts/gen-watermark-glyphs.ts` 用 Noto Sans TC 預先產生（見 passbook-watermark-glyphs.ts）。
 *
 * 形式：斜對角、半透明白字加深色描邊、4 列「嘟嘟資訊網 · 嘟嘟資訊網」平鋪。
 */
export function buildPassbookWatermarkSvg(width: number, height: number): string {
  const fontSize = Math.max(28, Math.round(width / 18));
  const scale = fontSize / WATERMARK_REF_SIZE;
  // glyph baseline 在 y=0、字身約落在 y∈[-REF, +0]，故下移 0.35*REF 使視覺中心對齊列基準線。
  const baselineShift = 0.35 * WATERMARK_REF_SIZE;
  // 縮放後抵銷，維持約 1px 視覺描邊。
  const strokeWidth = 1 / scale;

  const tiles = Array.from({ length: 4 })
    .map((_, i) => {
      const y = (i + 1) * (height / 5);
      return `<g transform="translate(${width / 2} ${y}) rotate(-25) scale(${scale}) translate(${-WATERMARK_ADVANCE / 2} ${baselineShift})">
        <path d="${WATERMARK_GLYPH_PATH}"
          fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.4)" stroke-width="${strokeWidth}"/>
      </g>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${tiles}</svg>`;
}
