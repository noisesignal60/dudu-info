import "server-only";

import sharp from "sharp";

/**
 * 為銀行存摺圖片加上「嘟嘟資訊網」浮水印。
 * 形式：斜對角、半透明、白色陰影。
 * 用戶不可覆蓋；上傳一次後即綁定。
 */
export async function addPassbookWatermark(
  buffer: ArrayBuffer | Buffer,
): Promise<Buffer> {
  const input = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  const base = sharp(input).rotate();
  const meta = await base.metadata();
  const width = meta.width ?? 1080;
  const height = meta.height ?? 720;

  const fontSize = Math.max(28, Math.round(width / 18));
  const svgText = `嘟嘟資訊網`;
  const tilePattern = Array.from({ length: 4 })
    .map(
      (_, i) =>
        `<text x="50%" y="${(i + 1) * (height / 5)}" text-anchor="middle"
           font-family="Noto Sans TC, sans-serif" font-size="${fontSize}"
           fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.4)" stroke-width="1"
           transform="rotate(-25, ${width / 2}, ${(i + 1) * (height / 5)})">
           ${svgText} · ${svgText}
         </text>`,
    )
    .join("");

  const overlay = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      ${tilePattern}
    </svg>
  `);

  return await base
    .composite([{ input: overlay, blend: "over" }])
    .jpeg({ quality: 88 })
    .toBuffer();
}
