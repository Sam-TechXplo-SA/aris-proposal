// Mock domain types for the Aris Brokers Claims Portal prototype.
// Mirrors the entities described in ux-blueprint.md §1.6/§5/§6 — no backend,
// this is the shape the in-memory/localStorage store (see store.tsx) persists.

export type Role =
  | "administrator"
  | "manager"
  | "broker"
  | "client_primary"
  | "client_secondary";

export const INTERNAL_ROLES: Role[] = ["administrator", "manager", "broker"];
export const CLIENT_ROLES: Role[] = ["client_primary", "client_secondary"];

// The real 16-stage client-facing status list, verbatim from
// docs/02-requirements/process-flow.md ("Claim Status Stages (Client-Facing)") — still
// explicitly labelled *proposed* there (Q-003, exact wording TBC with the Client), but
// this is the authoritative working list, not a synthesised approximation of one.
export type ClaimStatus =
  | "partially_submitted" // 1
  | "submitted" // 2
  | "documents_outstanding" // 3
  | "submitted_to_insurer" // 4
  | "under_assessment" // 5
  | "assessment_completed" // 6
  | "awaiting_insurer_decision" // 7
  | "settled" // 8 — Settled (cash, repair or replacement); transient, see store.tsx
  | "repudiated" // 9
  | "within_excess" // 10
  | "disputed" // 11
  | "awaiting_signed_aol" // 12
  | "awaiting_excess_invoice_and_pop" // 13
  | "awaiting_insurer_payment" // 14
  | "not_taken_up" // 15
  | "closed"; // 16

export type LodgementChannel = "self_service" | "broker_assisted";
export type DecisionOutcome = "settled" | "repudiated" | "within_excess" | "not_taken_up";
export type SettlementMethod = "cash" | "repair" | "replacement";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  clientId?: string; // only for client_primary / client_secondary
  active: boolean;
}

export interface ClientOrg {
  id: string;
  name: string;
  regNo?: string;
  address?: string;
  brokerId: string; // assigned Broker user id — business rule: single active assignment per client
  primaryContactId: string;
  secondaryContactId?: string;
  createdAt: string;
}

export interface PolicySection {
  id: string;
  policyId: string;
  name: string; // e.g. "Motor", "Property", "Public Liability", "Glass"
  insurer: string; // e.g. "Old Mutual", "Santam" — must match an insurer in claim-forms registry
  claimFormSlug: string; // maps 1:1 to a ClaimFormFiller forms/<slug>
  excess: number;
  requiresAsset: boolean;
}

export interface Policy {
  id: string;
  clientId: string;
  policyNumber: string;
  periodStart: string;
  periodEnd: string;
  sections: PolicySection[];
}

export interface Asset {
  id: string;
  sectionId: string;
  description: string; // vehicle reg/make/model, or a property address, etc.
}

export interface ChecklistItem {
  id: string;
  claimId: string;
  label: string;
  status: "outstanding" | "received";
  documentId?: string;
}

export type DocumentType =
  | "claim_form"
  | "photo"
  | "police_report"
  | "incident_report"
  | "unsigned_aol"
  | "signed_aol"
  | "proof_of_payment"
  | "excess_invoice"
  | "repudiation_letter"
  | "policy_schedule"
  | "other";

export interface ClaimDocument {
  id: string;
  claimId: string;
  type: DocumentType;
  filename: string;
  uploadedById: string;
  uploadedAt: string;
  checklistItemId?: string;
}

export interface Message {
  id: string;
  claimId: string;
  authorId: string;
  authorRole: Role;
  body: string;
  createdAt: string;
}

export interface CommentEntry {
  id: string;
  claimId: string;
  authorId: string;
  authorRole: Role;
  body: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  claimId?: string;
  clientId?: string;
  actorId: string;
  actorRole: Role;
  action: string;
  createdAt: string;
}

export interface Assessor {
  name?: string;
  company?: string;
  contact?: string;
}

export interface Decision {
  outcome: DecisionOutcome;
  repudiationReason?: string;
  settlementMethod?: SettlementMethod;
  notes?: string;
  decidedAt: string;
  decidedById: string;
}

export interface Claim {
  id: string;
  reference: string; // in-house generated, client cannot edit (business rule #3)
  clientId: string;
  policyId: string;
  sectionId: string;
  assetId?: string;
  claimType: string;
  dateOfLoss: string;
  location: string;
  narrative: string;
  lodgementChannel: LodgementChannel;
  lodgedById: string;
  brokerId: string;
  status: ClaimStatus;
  lateReported: boolean;
  lateReportedMotivation?: string;
  insurerClaimNo?: string;
  assessor?: Assessor;
  decision?: Decision;
  grossAmount?: number;
  /** Status to restore on "Resolve Dispute" — set when a claim is marked Disputed. */
  preDisputeStatus?: ClaimStatus;
  claimFormValues?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type ReportType = "claims_history" | "performance";
export type ReportScope = "consolidated" | { policyId: string };

export interface ReportRecord {
  id: string;
  type: ReportType;
  clientId: string;
  scope: ReportScope;
  periodStart: string;
  periodEnd: string;
  generatedById: string;
  generatedAt: string;
}

// The 5 client-facing stages the User Portal shows (UC-03) — each groups several of the
// 16 internal ClaimStatus values (see CLIENT_STAGE_OF in clientStatus.ts).
export type ClientStage = "received" | "documents_outstanding" | "with_insurer" | "decision_received" | "finalised";

export interface CompanySettings {
  companyName: string;
  fspLicence: string;
  disclaimerText: string;
  vatRate: number;
  defaultReminderIntervalDays: number;
  /** Administrator-configurable wording for the client-facing stages. */
  clientStageLabels: Record<ClientStage, string>;
}

export interface MockState {
  users: User[];
  clients: ClientOrg[];
  policies: Policy[];
  assets: Asset[];
  claims: Claim[];
  checklistItems: ChecklistItem[];
  documents: ClaimDocument[];
  messages: Message[];
  comments: CommentEntry[];
  auditEntries: AuditEntry[];
  reports: ReportRecord[];
  companySettings: CompanySettings;
}
