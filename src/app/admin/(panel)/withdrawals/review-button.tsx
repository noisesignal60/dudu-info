"use client";

import { useState, useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  approveWithdrawalAction,
  rejectWithdrawalAction,
  type WithdrawalDecisionState,
} from "@/actions/admin-withdrawals";
import type { AdminWithdrawalRow } from "@/data/admin/withdrawals";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { Alert } from "@/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";

const initial: WithdrawalDecisionState = { ok: false };

export function ReviewButton({
  withdrawal,
  passbookUrl,
}: {
  withdrawal: AdminWithdrawalRow;
  passbookUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const isPending = withdrawal.status === "pending";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-brand-dark hover:text-brand"
      >
        {isPending ? "審核" : "檢視"}
      </Button>
      <ReviewModal
        withdrawal={withdrawal}
        passbookUrl={passbookUrl}
        open={open}
        setOpen={setOpen}
      />
    </>
  );
}

function ReviewModal({
  withdrawal,
  passbookUrl,
  open,
  setOpen,
}: {
  withdrawal: AdminWithdrawalRow;
  passbookUrl: string | null;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const isPending = withdrawal.status === "pending";

  const [approveState, approveAction, approveLoading] = useActionState(
    approveWithdrawalAction.bind(null, withdrawal.id),
    initial,
  );
  const [rejectState, rejectAction, rejectLoading] = useActionState(
    rejectWithdrawalAction.bind(null, withdrawal.id),
    initial,
  );

  const submitted = approveState.ok || rejectState.ok;
  const [acked, setAcked] = useState(false);
  if (submitted && !acked) {
    setAcked(true);
    setOpen(false);
  } else if (!submitted && acked) {
    setAcked(false);
  }
  useEffect(() => {
    if (approveState.ok) toast.success(approveState.message ?? "已通過");
    else if (rejectState.ok) toast.success(rejectState.message ?? "已拒絕");
  }, [approveState, rejectState]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 py-4 border-b border-hairline">
          <DialogTitle>
            {isPending ? "審核提領申請" : "提領申請詳情"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* 申請資訊 */}
          <div className="space-y-3">
            <Row label="申請人">
              {withdrawal.memberName ?? withdrawal.memberLineDisplay ?? "—"}
            </Row>
            <Row label="提領金額">
              <span className="text-2xl font-black text-money tabular-nums">
                {formatCurrency(withdrawal.amount)}
              </span>
            </Row>
            <Row label="銀行代碼">{withdrawal.bankCode ?? "—"}</Row>
            <Row label="銀行帳號">{withdrawal.bankAccount ?? "—"}</Row>
            <Row label="用戶備註">{withdrawal.note ?? "—"}</Row>
            <Row label="申請時間">{formatDateTime(withdrawal.createdAt)}</Row>
            {!isPending && (
              <>
                <Row label="處理時間">
                  {withdrawal.processedAt
                    ? formatDateTime(withdrawal.processedAt)
                    : "—"}
                </Row>
                <Row label="管理員備註">{withdrawal.adminNote ?? "—"}</Row>
              </>
            )}
          </div>

          {/* 存摺圖片 */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-2">
              銀行存摺圖片
            </p>
            {passbookUrl ? (
              <a
                href={passbookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-hairline rounded-xl overflow-hidden"
                title="點擊在新分頁開啟並放大"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={passbookUrl} alt="存摺" className="w-full" />
              </a>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center text-slate-400">
                會員尚未上傳存摺圖片
              </div>
            )}
          </div>
        </div>

        {isPending && (
          <footer className="px-6 py-5 border-t border-hairline bg-background rounded-b-card space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <form action={rejectAction} className="space-y-2">
                <Textarea
                  name="adminNote"
                  rows={2}
                  placeholder="拒絕理由（建議填寫）"
                />
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  className="w-full"
                  disabled={rejectLoading || approveLoading}
                >
                  {rejectLoading ? "處理中..." : "拒絕"}
                </Button>
                {!rejectState.ok && rejectState.error && (
                  <Alert variant="danger">{rejectState.error}</Alert>
                )}
              </form>
              <form action={approveAction} className="space-y-2">
                <Textarea
                  name="adminNote"
                  rows={2}
                  placeholder="撥款備註（選填）"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={approveLoading || rejectLoading}
                >
                  {approveLoading ? "處理中..." : "通過"}
                </Button>
                {!approveState.ok && approveState.error && (
                  <Alert variant="danger">{approveState.error}</Alert>
                )}
              </form>
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 items-baseline">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="col-span-2 text-ink font-medium break-words">
        {children}
      </div>
    </div>
  );
}
