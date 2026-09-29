import Badge from "@/components/ui/badge/Badge";
import { statusColor, statusLabel } from "@/lib/mock/status";
import type { ClaimStatus } from "@/lib/mock/types";

// Single render point for a claim status — always goes through STATUS_META (lib/mock/status.ts)
// so the badge never drifts from the Reports legend, per ux-blueprint.md §22.5.
export default function StatusBadge({ status, size = "md" }: { status: ClaimStatus; size?: "sm" | "md" }) {
  return (
    <Badge color={statusColor(status)} size={size}>
      {statusLabel(status)}
    </Badge>
  );
}
