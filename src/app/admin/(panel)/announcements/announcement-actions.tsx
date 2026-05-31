"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  type AnnouncementFormState,
} from "@/actions/admin-announcements";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { Alert } from "@/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/ui/dialog";

const initial: AnnouncementFormState = { ok: false };

export function CreateAnnouncementButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        新增公告
      </Button>
      <CreateModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function CreateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    createAnnouncementAction,
    initial,
  );

  // 只在 state 由「非成功」轉為「成功」的那一刻觸發，避免重新進入頁面時誤跳
  const prev = useRef(state);
  useEffect(() => {
    const wasOk = prev.current.ok;
    prev.current = state;
    if (state.ok && !wasOk) {
      toast.success(state.message ?? "已發布公告");
      onClose();
    }
    // onClose 為父層每次 render 重建的函式，刻意不列入相依以免重複觸發
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const err = (k: string) =>
    state.ok === false ? state.fieldErrors?.[k] : undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增公告</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">標題</Label>
            <Input
              id="title"
              name="title"
              inputSize="sm"
              placeholder="例如：本週分潤已撥款"
              aria-invalid={!!err("title")}
            />
            {err("title") && (
              <p className="text-sm text-money font-medium">{err("title")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">內容</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="請輸入公告內容…"
              aria-invalid={!!err("content")}
            />
            {err("content") && (
              <p className="text-sm text-money font-medium">{err("content")}</p>
            )}
          </div>
          {state.ok === false && state.error && (
            <Alert variant="danger">{state.error}</Alert>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={onClose}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "發布中…" : "發布"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteAnnouncementButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        刪除
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>刪除公告</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            確定要刪除「{title}」這則公告嗎？此操作無法復原。
          </p>
          {error && <p className="text-sm text-money font-medium">{error}</p>}
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await deleteAnnouncementAction(id);
                    setOpen(false);
                    toast.success("已刪除公告");
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
