"use client";

import { useState } from "react";
import { Button } from "@/ui/button";

export function CopyButton({ text, label = "複製" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("請手動複製：", text);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="touch"
      onClick={handleCopy}
      aria-live="polite"
      className="w-full"
    >
      {copied ? "已複製" : label}
    </Button>
  );
}
