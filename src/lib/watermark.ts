import "server-only";

import sharp from "sharp";
import { buildPassbookWatermarkSvg } from "./passbook-watermark";

/**
 * 為銀行存摺圖片加上「嘟嘟資訊網」浮水印。
 * 形式：斜對角、半透明、白色陰影。
 * 用戶不可覆蓋；上傳一次後即綁定。
 *
 * 浮水印 SVG 由同構函式 `buildPassbookWatermarkSvg` 產生，與前端上傳預覽共用同一份來源。
 */
export async function addPassbookWatermark(
  buffer: ArrayBuffer | Buffer,
): Promise<Buffer> {
  const input = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  const base = sharp(input).rotate();
  const meta = await base.metadata();
  const width = meta.width ?? 1080;
  const height = meta.height ?? 720;

  const overlay = Buffer.from(buildPassbookWatermarkSvg(width, height));

  return await base
    .composite([{ input: overlay, blend: "over" }])
    .jpeg({ quality: 88 })
    .toBuffer();
}
