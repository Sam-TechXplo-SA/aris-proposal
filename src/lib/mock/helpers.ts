import type { Claim, ClaimDocument, ClaimStatus, MockState, Policy, PolicySection, ReportScope, User } from "./types";

export function reportScopeLabel(scope: ReportScope, policies: Policy[]): string {
  if (scope === "consolidated") return "Consolidated";
  return policies.find((p) => p.id === scope.policyId)?.policyNumber ?? "Single policy";
}

// Statuses where the Broker/Admin has something to do next — used to sort the Claims
// queue "by what needs attention" rather than a flat list, per ux-blueprint.md §5.2/§13.3.
const NEEDS_ACTION_STATUSES: ClaimStatus[] = [
  "partially_submitted",
  "submitted",
  "documents_outstanding",
  "submitted_to_insurer",
  "under_assessment",
  "assessment_completed",
  "awaiting_insurer_decision",
  "disputed",
];

export function needsAttentionClaims(claims: Claim[]): Claim[] {
  return claims.filter((c) => NEEDS_ACTION_STATUSES.includes(c.status) || c.lateReported);
}

export function sortClaimsByAttention(claims: Claim[]): Claim[] {
  return [...claims].sort((a, b) => {
    const aNeeds = NEEDS_ACTION_STATUSES.includes(a.status) ? 0 : 1;
    const bNeeds = NEEDS_ACTION_STATUSES.includes(b.status) ? 0 : 1;
    if (aNeeds !== bNeeds) return aNeeds - bNeeds;
    if (a.lateReported !== b.lateReported) return a.lateReported ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function findUser(state: MockState, id?: string): User | undefined {
  return id ? state.users.find((u) => u.id === id) : undefined;
}

export function findClient(state: MockState, id?: string) {
  return id ? state.clients.find((c) => c.id === id) : undefined;
}

export function findPolicy(state: MockState, id?: string) {
  return id ? state.policies.find((p) => p.id === id) : undefined;
}

export function findSection(state: MockState, id?: string): PolicySection | undefined {
  if (!id) return undefined;
  for (const policy of state.policies) {
    const match = policy.sections.find((s) => s.id === id);
    if (match) return match;
  }
  return undefined;
}

export function findAsset(state: MockState, id?: string) {
  return id ? state.assets.find((a) => a.id === id) : undefined;
}

export function checklistFor(state: MockState, claimId: string) {
  return state.checklistItems.filter((c) => c.claimId === claimId);
}

export function documentsFor(state: MockState, claimId: string) {
  return state.documents.filter((d) => d.claimId === claimId);
}

export function messagesFor(state: MockState, claimId: string) {
  return state.messages.filter((m) => m.claimId === claimId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function commentsFor(state: MockState, claimId: string) {
  return state.comments.filter((c) => c.claimId === claimId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function auditFor(state: MockState, opts: { claimId?: string; clientId?: string }) {
  return state.auditEntries
    .filter((a) => (opts.claimId ? a.claimId === opts.claimId : true) && (opts.clientId ? a.clientId === opts.clientId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(amount);
}

/**
 * One-line "what does the client need to do" per claim, per ux-blueprint.md §13.5:
 * "a one-line call-to-action only when the Client genuinely has something to do."
 * Returns undefined when nothing is outstanding — the caller should show a calm
 * positive state instead, never an empty gap (§13.6).
 */
export function clientAttentionFor(claim: Claim, documents: ClaimDocument[]): string | undefined {
  if (claim.status === "partially_submitted") return "Complete the insurer claim form to submit this claim.";
  if (claim.status === "awaiting_signed_aol") {
    const hasSigned = documents.some((d) => d.claimId === claim.id && d.type === "signed_aol");
    return hasSigned ? "Your signed Agreement of Loss is with your Broker." : "Download, sign, and upload your Agreement of Loss.";
  }
  if (claim.status === "awaiting_excess_invoice_and_pop") {
    const hasInvoice = documents.some((d) => d.claimId === claim.id && d.type === "excess_invoice");
    if (!hasInvoice) return undefined; // nothing to do until the Broker issues the invoice
    const hasProof = documents.some((d) => d.claimId === claim.id && d.type === "proof_of_payment");
    return hasProof ? undefined : "Pay the excess invoice and upload proof of payment.";
  }
  return undefined;
}
