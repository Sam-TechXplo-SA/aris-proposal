"use client";

import StatusBadge from "@/components/claims/StatusBadge";
import ComponentCard from "@/components/common/ComponentCard";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
} from "@/components/ui/stepper/Stepper";
import type { Claim, ClaimStatus } from "@/lib/mock/types";

export interface OverallStage {
  label: string;
  statuses: ClaimStatus[];
}

// The overall claim journey, condensed from the 16-stage status list (process-flow.md)
// into the milestones most users recognise. Multiple fine-grained statuses share a phase.
export const OVERALL_STAGES: OverallStage[] = [
  { label: "Submitted", statuses: ["partially_submitted", "submitted", "documents_outstanding"] },
  { label: "With Insurer", statuses: ["submitted_to_insurer"] },
  { label: "Assessment", statuses: ["under_assessment", "assessment_completed"] },
  { label: "Decision", statuses: ["awaiting_insurer_decision", "repudiated", "within_excess", "not_taken_up"] },
  { label: "Settlement", statuses: ["settled", "awaiting_signed_aol", "awaiting_excess_invoice_and_pop", "awaiting_insurer_payment"] },
  { label: "Closed", statuses: ["closed"] },
];

function activeStageIndex(claim: Claim): number {
  const resolved: ClaimStatus =
    claim.status === "disputed" ? (claim.preDisputeStatus ?? "awaiting_insurer_decision") : claim.status;
  const index = OVERALL_STAGES.findIndex((stage) => stage.statuses.includes(resolved));
  return index === -1 ? 3 : index; // fall back to "Decision" for unknown/edge states
}

export default function ClaimProgress({ claim }: { claim: Claim }) {
  const active = activeStageIndex(claim);

  return (
    <ComponentCard title="Overall Progress">
      <div className="overflow-x-auto pb-1">
        <Stepper value={active + 1} orientation="horizontal" className="pt-1">
          {OVERALL_STAGES.map((stage, i) => (
            <StepperItem key={stage.label} step={i + 1}>
              <StepperIndicator />
              <StepperTitle>{stage.label}</StepperTitle>
              {i < OVERALL_STAGES.length - 1 && <StepperSeparator />}
            </StepperItem>
          ))}
        </Stepper>
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <span className="text-theme-xs font-medium text-gray-400">Current status</span>
        <StatusBadge status={claim.status} size="sm" />
      </div>
    </ComponentCard>
  );
}