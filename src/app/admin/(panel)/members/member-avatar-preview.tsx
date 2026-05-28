"use client";

import { useState } from "react";
import { UserCircle2, X } from "lucide-react";
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
    return (
      <div className="w-10 h-10 rounded-full bg-slate-200 grid place-items-center">
        <UserCircle2 className="w-6 h-6 text-slate-400" />
      </div>
    );
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
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-6"
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
          <Img
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
