import { clientStageLabel, clientStageOf } from "@/lib/mock/clientStatus";
import { useData } from "@/lib/mock/store";
import type { ClaimStatus, ClientStage } from "@/lib/mock/types";
import { cn } from "@/utils";

const STAGE_STYLES: Record<ClientStage, { pill: string; dot: string }> = {
  received: {
    pill: "bg-gray-100 text-gray-700 dark:bg-white/8 dark:text-gray-200",
    dot: "bg-blue-light-400",
  },
  documents_outstanding: {
    pill: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300",
    dot: "bg-warning-500",
  },
  with_insurer: {
    pill: "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-300",
    dot: "bg-blue-light-500",
  },
  decision_received: {
    pill: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
    dot: "bg-success-500",
  },
  finalised: {
    pill: "bg-gray-50 text-gray-500 ring-1 ring-gray-200 ring-inset dark:bg-transparent dark:text-gray-400 dark:ring-gray-700",
    dot: "bg-gray-400 dark:bg-gray-500",
  },
};

// Client-facing counterpart to StatusBadge: renders the Administrator-configured stage
// label, never the internal status name.
export default function ClientStatusPill({ status, className }: { status: ClaimStatus; className?: string }) {
  const { state } = useData();
  const stage = clientStageOf(status);
  const styles = STAGE_STYLES[stage];

  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-theme-xs font-medium whitespace-nowrap", styles.pill, className)}>
      <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden />
      {clientStageLabel(state, stage)}
    </span>
  );
}
