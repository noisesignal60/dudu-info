const MAP = {
  pending: { label: "審核中", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "已通過", className: "bg-brand-soft text-brand-dark border-brand/30" },
  rejected: { label: "已拒絕", className: "bg-red-100 text-red-700 border-red-200" },
} as const;

export function WithdrawalStatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const cfg = MAP[status];
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
