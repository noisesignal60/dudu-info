import { Badge } from "@/ui/badge";

const LABEL = {
  pending: "審核中",
  approved: "已通過",
  rejected: "已拒絕",
} as const;

export function WithdrawalStatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  return <Badge variant={status}>{LABEL[status]}</Badge>;
}
