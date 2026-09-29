import { clientAttentionFor, findAsset } from "./helpers";
import type { Claim, ClaimStatus, ClientStage, MockState } from "./types";

// Client-facing status model for the User Portal (UC-03 — Track Claim Status). Clients
// never see the 16 internal states; each one collapses into one of five plain-language
// stages. The wording is Administrator-configurable (companySettings.clientStageLabels);
// the grouping below is fixed.

export const CLIENT_STAGES: ClientStage[] = ["received", "documents_outstanding", "with_insurer", "decision_received", "finalised"];

export const DEFAULT_CLIENT_STAGE_LABELS: Record<ClientStage, string> = {
  received: "Received",
  documents_outstanding: "Documents outstanding",
  with_insurer: "With Insurer",
  decision_received: "Decision received",
  finalised: "Finalised",
};

/** The internal state each stage stands for — shown next to the label field in Settings. */
export const CLIENT_STAGE_SOURCE: Record<ClientStage, string> = {
  received: "Lodged",
  documents_outstanding: "Awaiting documents",
  with_insurer: "Submitted to Insurer",
  decision_received: "Decision recorded",
  finalised: "Closed",
};

const CLIENT_STAGE_OF: Record<ClaimStatus, ClientStage> = {
  partially_submitted: "received",
  submitted: "received",
  documents_outstanding: "documents_outstanding",
  submitted_to_insurer: "with_insurer",
  under_assessment: "with_insurer",
  assessment_completed: "with_insurer",
  awaiting_insurer_decision: "with_insurer",
  settled: "decision_received",
  repudiated: "decision_received",
  within_excess: "decision_received",
  not_taken_up: "decision_received",
  disputed: "decision_received",
  awaiting_signed_aol: "decision_received",
  awaiting_excess_invoice_and_pop: "decision_received",
  awaiting_insurer_payment: "decision_received",
  closed: "finalised",
};

export function clientStageOf(status: ClaimStatus): ClientStage {
  return CLIENT_STAGE_OF[status];
}

export function clientStageLabel(state: MockState, stage: ClientStage): string {
  return state.companySettings.clientStageLabels?.[stage] || DEFAULT_CLIENT_STAGE_LABELS[stage];
}

/** Title a client recognises: the insured asset if there is one, else the type and place of loss. */
export function clientClaimTitle(state: MockState, claim: Claim): string {
  const asset = findAsset(state, claim.assetId);
  return asset ? asset.description : `${claim.claimType} — ${claim.location}`;
}

function listPhrase(items: string[]): string {
  const lower = items.map((s) => s.charAt(0).toLowerCase() + s.slice(1));
  return lower.join(", ");
}

/**
 * The one-line, plain-language note under the progress tracker. `blocking` is true when
 * the claim is waiting on the client — the tracker highlights the current stage in amber.
 */
export function clientStageNote(state: MockState, claim: Claim): { text: string; blocking: boolean } {
  const stage = clientStageOf(claim.status);
  const attention = clientAttentionFor(claim, state.documents);
  if (attention) return { text: attention, blocking: true };

  if (stage === "documents_outstanding") {
    const outstanding = state.checklistItems.filter((c) => c.claimId === claim.id && c.status === "outstanding").map((c) => c.label);
    return {
      text: outstanding.length ? `We're still waiting on: ${listPhrase(outstanding)}.` : "Your broker is checking the documents you sent.",
      blocking: outstanding.length > 0,
    };
  }

  switch (claim.status) {
    case "submitted":
      return { text: "Your broker has your claim and is preparing it for the insurer.", blocking: false };
    case "submitted_to_insurer":
      return { text: "Your claim is with the insurer. We'll let you know when an assessor is appointed.", blocking: false };
    case "under_assessment":
    case "assessment_completed":
      return { text: "The insurer's assessor is reviewing the loss. Nothing is needed from you right now.", blocking: false };
    case "awaiting_insurer_decision":
      return { text: "Assessment is done and the insurer is making its decision.", blocking: false };
    case "awaiting_insurer_payment":
      return { text: "The insurer has agreed to settle. Payment is on its way.", blocking: false };
    case "repudiated":
      return { text: "The insurer has declined this claim. Your broker will explain the reasons.", blocking: false };
    case "within_excess":
      return { text: "The loss falls within your excess, so the insurer won't pay out.", blocking: false };
    case "not_taken_up":
      return { text: "This claim was withdrawn and won't go ahead.", blocking: false };
    case "disputed":
      return { text: "Your broker is taking the decision up with the insurer on your behalf.", blocking: false };
    case "closed":
      return { text: "This claim is finalised. You can still view it, but it can't be changed.", blocking: false };
    default:
      return { text: "The insurer has made a decision. Your broker will be in touch about next steps.", blocking: false };
  }
}
