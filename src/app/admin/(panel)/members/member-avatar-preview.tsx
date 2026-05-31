"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/dialog";
// eslint-disable-next-line @next/next/no-img-element
const Img = (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt ?? ""} />;

export function MemberAvatarPreview({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [open, setOpen] = useState(false);
  if (!src) {
    return <div className="w-10 h-10 rounded-full bg-slate-200" />;
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block rounded-full ring-2 ring-transparent hover:ring-brand transition"
        title="點擊放大"
      >
        <Img
          src={src}
          alt={alt}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover bg-slate-200"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-fit border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <Img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[80vh] rounded-card shadow-premium object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
