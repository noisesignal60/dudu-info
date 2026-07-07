"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Excel 式表格尺寸（逐欄寬、逐列高）的共用 hook。
 *
 * - 欄寬：每欄一個寬度，套用該欄所有列（以欄位 id 為鍵）。
 * - 列高：每列各自一個高度（以 row.key 為鍵），未調整的列回退到 defaultRowHeight。
 * - 持久化：localStorage[storageKey]，形如 `{ widths, rowHeights }`。
 * - 拖移：Pointer Events，掛在 window 上監聽，拖移中停用文字選取並切換游標。
 *
 * 供「可編輯帳簿網格」與「唯讀彙總表」共用，避免散寫一次性拖移邏輯。
 */

export const MIN_COL = 56;
export const MAX_COL = 480;
export const MIN_ROW = 28;
export const MAX_ROW = 160;

type Sizes = {
  widths: Record<string, number>;
  rowHeights: Record<string, number>;
};

type Params = {
  /** localStorage 鍵；不同表格用不同鍵。 */
  storageKey: string;
  /** 各欄預設寬度，以欄位 id 為鍵。 */
  defaultWidths: Record<string, number>;
  /** 未調整列的預設高度（px）。 */
  defaultRowHeight: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function useSheetResize({
  storageKey,
  defaultWidths,
  defaultRowHeight,
}: Params) {
  // 首次 render（含 SSR）一律用預設值，掛載後才從 localStorage 還原，避免 hydration mismatch。
  const [sizes, setSizes] = useState<Sizes>(() => ({
    widths: { ...defaultWidths },
    rowHeights: {},
  }));
  const hydratedRef = useRef(false);

  // 還原（僅掛載一次）。只接受 defaultWidths 既有的欄位 key，數值一律 clamp。
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Sizes>;
        const widths = { ...defaultWidths };
        if (parsed.widths) {
          for (const key of Object.keys(defaultWidths)) {
            const v = parsed.widths[key];
            if (typeof v === "number" && Number.isFinite(v)) {
              widths[key] = clamp(v, MIN_COL, MAX_COL);
            }
          }
        }
        const rowHeights: Record<string, number> = {};
        if (parsed.rowHeights) {
          for (const [key, v] of Object.entries(parsed.rowHeights)) {
            if (typeof v === "number" && Number.isFinite(v)) {
              rowHeights[key] = clamp(v, MIN_ROW, MAX_ROW);
            }
          }
        }
        // 刻意在掛載後才同步：首次 render 必須用預設值以對齊 SSR，
        // 避免 hydration mismatch。這一次額外 render 是必要且一次性的。
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSizes({ widths, rowHeights });
      }
    } catch {
      // 壞掉的值忽略，沿用預設。
    }
    hydratedRef.current = true;
    // 僅依 storageKey；defaultWidths/defaultRowHeight 視為穩定常數。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // 持久化（還原完成後才寫，避免把預設值覆蓋掉尚未讀到的值）。
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(sizes));
    } catch {
      // 容量已滿或隱私模式：忽略。
    }
  }, [storageKey, sizes]);

  // 共用的拖移啟動器：axis 決定改寬或改高。
  const startDrag = useCallback(
    (
      e: React.PointerEvent,
      axis: "x" | "y",
      start: number,
      apply: (next: number) => void,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const origin = axis === "x" ? e.clientX : e.clientY;
      const [lo, hi] = axis === "x" ? [MIN_COL, MAX_COL] : [MIN_ROW, MAX_ROW];

      const prevCursor = document.body.style.cursor;
      const prevSelect = document.body.style.userSelect;
      document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: PointerEvent) => {
        const delta = (axis === "x" ? ev.clientX : ev.clientY) - origin;
        apply(clamp(start + delta, lo, hi));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevSelect;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [],
  );

  const startColResize = useCallback(
    (colId: string, e: React.PointerEvent) => {
      const startW = sizes.widths[colId] ?? defaultWidths[colId];
      startDrag(e, "x", startW, (next) =>
        setSizes((s) => ({ ...s, widths: { ...s.widths, [colId]: next } })),
      );
    },
    [sizes.widths, defaultWidths, startDrag],
  );

  // 直接設定某欄寬度（供 AutoFit 雙擊自動符合內容）；一律 clamp。
  const setColWidth = useCallback((colId: string, width: number) => {
    setSizes((s) => ({
      ...s,
      widths: { ...s.widths, [colId]: clamp(width, MIN_COL, MAX_COL) },
    }));
  }, []);

  const startRowResize = useCallback(
    (rowKey: string, e: React.PointerEvent) => {
      const startH = sizes.rowHeights[rowKey] ?? defaultRowHeight;
      startDrag(e, "y", startH, (next) =>
        setSizes((s) => ({
          ...s,
          rowHeights: { ...s.rowHeights, [rowKey]: next },
        })),
      );
    },
    [sizes.rowHeights, defaultRowHeight, startDrag],
  );

  const getRowHeight = useCallback(
    (rowKey: string) => sizes.rowHeights[rowKey] ?? defaultRowHeight,
    [sizes.rowHeights, defaultRowHeight],
  );

  const reset = useCallback(() => {
    setSizes({ widths: { ...defaultWidths }, rowHeights: {} });
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // 忽略
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // 列號欄寬固定，總寬 = 各欄寬加總（供 table 設定明確寬度以支援水平捲動）。
  const totalWidth = Object.keys(defaultWidths).reduce(
    (sum, key) => sum + (sizes.widths[key] ?? defaultWidths[key]),
    0,
  );

  return {
    widths: sizes.widths,
    totalWidth,
    getRowHeight,
    startColResize,
    startRowResize,
    setColWidth,
    reset,
  };
}
