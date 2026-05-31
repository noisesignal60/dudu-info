"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/dialog";

export function PassbookViewer({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full group relative rounded-xl overflow-hidden border border-hairline"
        title="點擊放大"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="存摺圖片" className="w-full" />
        <span className="absolute top-2 right-2 inline-flex items-center bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition">
          放大
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] bg-transparent border-0 p-0 shadow-none">
          <DialogTitle className="sr-only">存摺圖片</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="存摺圖片"
            className="max-w-[95vw] max-h-[90vh] rounded-xl object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
