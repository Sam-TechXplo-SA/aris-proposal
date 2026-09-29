import type { ClaimStatus } from "./types";

export type StatusBadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface StatusMeta {
  label: string;
  color: StatusBadgeColor;
  order: number;
}

// Single source of truth for status label + badge colour, per ux-blueprint.md §22.5:
// "the in-app status badge... must be driven by the same status→colour mapping" everywhere
// a status renders. In the real product this table is Administrator-configurable
// (Company & Report Settings, FR-06) — see (admin)/settings/company. Wording is the
// real 16-stage list from docs/02-requirements/process-flow.md, itself still labelled
// proposed there (Q-003) — see types.ts's ClaimStatus comment.
export const STATUS_META: Record<ClaimStatus, StatusMeta> = {
  partially_submitted: { label: "Partially Submitted", color: "light", order: 0 },
  submitted: { label: "Submitted", color: "info", order: 1 },
  documents_outstanding: { label: "Documents Outstanding", color: "warning", order: 2 },
  submitted_to_insurer: { label: "Submitted to Insurer", color: "info", order: 3 },
  under_assessment: { label: "Under Assessment", color: "info", order: 4 },
  assessment_completed: { label: "Assessment Completed", color: "info", order: 5 },
  awaiting_insurer_decision: { label: "Awaiting Insurer Decision", color: "warning", order: 6 },
  settled: { label: "Settled", color: "success", order: 7 },
  repudiated: { label: "Repudiated", color: "error", order: 7 },
  within_excess: { label: "Within Excess", color: "warning", order: 7 },
  not_taken_up: { label: "Not Taken Up", color: "dark", order: 7 },
  disputed: { label: "Disputed", color: "error", order: 8 },
  awaiting_signed_aol: { label: "Awaiting Signed Agreement of Loss", color: "warning", order: 9 },
  awaiting_excess_invoice_and_pop: {
    label: "Awaiting Excess Invoice & Proof of Payment",
    color: "warning",
    order: 9,
  },
  awaiting_insurer_payment: { label: "Awaiting Insurer Payment", color: "warning", order: 10 },
  closed: { label: "Closed", color: "dark", order: 11 },
};

export function statusLabel(status: ClaimStatus): string {
  return STATUS_META[status].label;
}

export function statusColor(status: ClaimStatus): StatusBadgeColor {
  return STATUS_META[status].color;
}

export const ALL_STATUSES = Object.keys(STATUS_META) as ClaimStatus[];
