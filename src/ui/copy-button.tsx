"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

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
    <button
      type="button"
      onClick={handleCopy}
      className="btn-secondary"
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 text-brand" />
          已複製
        </>
      ) : (
        <>
          <Copy className="w-5 h-5" />
          {label}
        </>
      )}
    </button>
  );
}
