"use client";

import { useState, useTransition } from "react";
import { deleteMemberAction } from "@/actions/admin-members";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog";

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
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        刪除會員
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>刪除會員</DialogTitle>
            <DialogDescription>
              這個動作會永久刪除 {name || "此會員"} 的所有資料，包括交易紀錄、提領申請與餘額。此操作無法復原。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              請輸入「DELETE」以確認：
            </Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              inputSize="sm"
              placeholder="DELETE"
            />
            {error && <p className="text-sm text-money font-medium">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              size="sm"
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
            >
              {isPending ? "刪除中…" : "確定刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
