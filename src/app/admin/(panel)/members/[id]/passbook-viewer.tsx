"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

export function PassbookViewer({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full group relative rounded-xl overflow-hidden border border-slate-200"
        title="點擊放大"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="存摺圖片" className="w-full" />
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition">
          <ZoomIn className="w-3.5 h-3.5" />
          放大
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow"
            aria-label="關閉"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="存摺圖片"
            className="max-w-[95vw] max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
