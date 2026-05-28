"use client";

import { MessageCircle } from "lucide-react";

export function ShareLineButton({ text }: { text: string }) {
  const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary"
    >
      <MessageCircle className="w-5 h-5" />
      分享到 LINE
    </a>
  );
}
