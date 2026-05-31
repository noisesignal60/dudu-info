"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

export function MemberSearchBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const urlQ = sp.get("q") ?? "";
  // React 官方「同步 prop 變動」pattern：在 render 內比較並更新（非 effect）
  const [q, setQ] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setQ(urlQ);
  }
  const [isPending, startTransition] = useTransition();

  function submit(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    params.delete("page"); // 搜尋變更時回到第一頁
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(q);
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1 max-w-xl">
        <Input
          type="search"
          inputSize="sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋姓名、LINE 名稱、推薦碼或電話…"
          className="pr-10"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              submit("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-secondary"
            aria-label="清除搜尋"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "搜尋中…" : "搜尋"}
      </Button>
    </form>
  );
}
