"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { deleteMemberAction } from "@/actions/admin-members";

export function DeleteMemberButton({
  memberId,
  name,
}: {
  memberId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-danger !min-h-10 !text-sm"
      >
        <Trash2 className="w-4 h-4" />
        刪除會員
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">確認刪除會員</h3>
              <button onClick={() => setOpen(false)} aria-label="關閉" className="p-1">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="mt-3 text-slate-700">
              這個動作會永久刪除 <strong>{name || "此會員"}</strong>{" "}
              的所有資料，包括交易紀錄、提領申請與餘額。
              <br />
              <span className="text-money font-semibold">此動作無法復原。</span>
            </p>
            <p className="mt-4 text-sm text-slate-600">
              請輸入「<span className="font-bold">DELETE</span>」以確認：
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="input-base mt-2 !min-h-10 !text-sm"
              placeholder="DELETE"
            />
            {error && <p className="mt-2 text-sm text-money">{error}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary !min-h-10 !text-sm"
              >
                取消
              </button>
              <button
                type="button"
                disabled={confirmText !== "DELETE" || isPending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    try {
                      await deleteMemberAction(memberId);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "刪除失敗");
                    }
                  });
                }}
                className="btn-danger !min-h-10 !text-sm disabled:opacity-50"
              >
                {isPending ? "刪除中…" : "確認刪除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
