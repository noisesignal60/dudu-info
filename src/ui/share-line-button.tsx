"use client";

import { Button } from "@/ui/button";

export function ShareLineButton({ text }: { text: string }) {
  const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
  return (
    <Button asChild size="touch" className="w-full">
      <a href={url} target="_blank" rel="noopener noreferrer">
        分享到 LINE
      </a>
    </Button>
  );
}
