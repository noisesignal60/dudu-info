"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// SSR 時沒有 layout 階段，退回 useEffect 以免 React 警告
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * 單行文字自動縮放：依容器寬度把字級縮到剛好塞滿一行，不換行也不溢出。
 * 用於統計卡片金額——平板窄欄遇到大數字時自動縮小，桌機/手機夠寬則維持原字級。
 *
 * - className：外層量測容器（控制間距等版面）。
 * - textClassName：內層文字（字體、字重、顏色、字級上限，如 text-xl）。
 * - minFontPx：縮放下限，避免縮到不可讀。
 */
export function FitText({
  children,
  className,
  textClassName,
  minFontPx = 12,
}: {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  minFontPx?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    const fit = () => {
      // 先還原為 CSS 預設字級（隨斷點變動的 text-xl），作為縮放上限
      text.style.fontSize = "";
      const max = parseFloat(getComputedStyle(text).fontSize);
      const avail = box.clientWidth;
      const natural = text.scrollWidth;
      if (avail > 0 && natural > avail) {
        text.style.fontSize = `${Math.max(minFontPx, (max * avail) / natural)}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [children, minFontPx]);

  return (
    <div ref={boxRef} className={cn("text-center", className)}>
      <span
        ref={textRef}
        className={cn("inline-block whitespace-nowrap", textClassName)}
      >
        {children}
      </span>
    </div>
  );
}
