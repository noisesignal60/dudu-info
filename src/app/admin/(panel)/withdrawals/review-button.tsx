"use client";

import { useState, useActionState } from "react";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import {
  approveWithdrawalAction,
  rejectWithdrawalAction,
  type WithdrawalDecisionState,
} from "@/actions/admin-withdrawals";
import type { AdminWithdrawalRow } from "@/data/admin/withdrawals";
import { formatCurrency, formatDateTime } from "@/lib/utils";

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-brand-dark hover:text-brand font-semibold"
      >
        {isPending ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            審核
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            檢視
          </>
        )}
      </button>
      {open && (
        <ReviewModal
          withdrawal={withdrawal}
          passbookUrl={passbookUrl}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ReviewModal({
  withdrawal,
  passbookUrl,
  onClose,
}: {
  withdrawal: AdminWithdrawalRow;
  passbookUrl: string | null;
  onClose: () => void;
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
  if (submitted) setTimeout(onClose, 800);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">
            {isPending ? "審核提領申請" : "提領申請詳情"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            ✕
          </button>
        </header>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* 申請資訊 */}
          <div className="space-y-3">
            <Row label="申請人">
              {withdrawal.memberName ?? withdrawal.memberLineDisplay ?? "—"}
            </Row>
            <Row label="提領金額">
              <span className="text-2xl font-black text-money">
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
                className="block border border-slate-200 rounded-xl overflow-hidden"
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
          <footer className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <form action={rejectAction} className="space-y-2">
                <textarea
                  name="adminNote"
                  rows={2}
                  className="input-base py-2"
                  placeholder="拒絕理由（建議填寫）"
                />
                <button
                  type="submit"
                  disabled={rejectLoading || approveLoading}
                  className="btn-danger w-full !min-h-12"
                >
                  <XCircle className="w-5 h-5" />
                  {rejectLoading ? "處理中..." : "拒絕"}
                </button>
                {!rejectState.ok && rejectState.error && (
                  <p className="text-sm text-red-600">{rejectState.error}</p>
                )}
              </form>
              <form action={approveAction} className="space-y-2">
                <textarea
                  name="adminNote"
                  rows={2}
                  className="input-base py-2"
                  placeholder="撥款備註（選填）"
                />
                <button
                  type="submit"
                  disabled={approveLoading || rejectLoading}
                  className="btn-primary w-full !min-h-12"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {approveLoading ? "處理中..." : "通過"}
                </button>
                {!approveState.ok && approveState.error && (
                  <p className="text-sm text-red-600">{approveState.error}</p>
                )}
              </form>
            </div>
            {(approveState.ok || rejectState.ok) && (
              <p className="text-sm text-green-700 font-medium text-center">
                {approveState.ok
                  ? approveState.message
                  : rejectState.ok
                    ? rejectState.message
                    : ""}
              </p>
            )}
          </footer>
        )}
      </div>
    </div>
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
      <div className="col-span-2 text-slate-900 font-medium break-words">
        {children}
      </div>
    </div>
  );
}
