"use client";

import { useEffect, useSyncExternalStore } from "react";

const SCALES = ["base", "large", "xlarge"] as const;
type Scale = (typeof SCALES)[number];

const LABELS: Record<Scale, string> = {
  base: "A",
  large: "A+",
  xlarge: "A++",
};

const KEY = "font-scale";

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
function getSnapshot(): Scale {
  if (typeof window === "undefined") return "base";
  const v = window.localStorage.getItem(KEY);
  if (v === "large" || v === "xlarge") return v;
  return "base";
}
function getServerSnapshot(): Scale {
  return "base";
}

export function FontScaleToggle() {
  const scale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function next() {
    const idx = SCALES.indexOf(scale);
    const nx = SCALES[(idx + 1) % SCALES.length];
    localStorage.setItem(KEY, nx);
    document.documentElement.dataset.fontScale = nx === "base" ? "" : nx;
    // 觸發 storage 事件以更新本元件
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  }

  // 同步 DOM dataset（只更新外部，不影響 React state）
  useEffect(() => {
    document.documentElement.dataset.fontScale = scale === "base" ? "" : scale;
  }, [scale]);

  return (
    <button
      type="button"
      onClick={next}
      className="btn-secondary min-w-14 min-h-12 px-3"
      title="切換字體大小"
      aria-label="切換字體大小"
    >
      <span className="font-bold">{LABELS[scale]}</span>
    </button>
  );
}
