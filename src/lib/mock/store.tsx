"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { buildSeedState } from "./seed";
import { STATUS_META } from "./status";
import type {
  Assessor,
  Asset,
  AuditEntry,
  ChecklistItem,
  ClientOrg,
  Claim,
  ClaimDocument,
  ClaimStatus,
  CommentEntry,
  CompanySettings,
  Decision,
  DocumentType,
  LodgementChannel,
  Message,
  MockState,
  Policy,
  PolicySection,
  ReportRecord,
  Role,
  User,
} from "./types";

// Bump the version suffix whenever the persisted shape changes (e.g. ClaimStatus
// enum values) — an old cached blob wouldn't match STATUS_META and would crash on read.
const STORAGE_KEY = "aris-claims-mock-state-v3";
const LATE_REPORT_DAYS = 30;

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextClaimReference(state: MockState): string {
  const year = new Date().getFullYear();
  const seq = state.claims.length + 1001;
  return `ARB-${year}-${seq}`;
}

function defaultChecklist(claimId: string): ChecklistItem[] {
  return [
    { id: uid(`chk-${claimId}`), claimId, label: "Completed claim form", status: "outstanding" },
    { id: uid(`chk-${claimId}`), claimId, label: "Photographs of damage", status: "outstanding" },
  ];
}

function audit(
  entries: AuditEntry[],
  entry: Omit<AuditEntry, "id" | "createdAt">,
): AuditEntry[] {
  return [...entries, { ...entry, id: uid("aud"), createdAt: nowIso() }];
}

// Stages 2/3 of the 16-stage list ("Submitted" vs "Documents Outstanding") are two
// faces of the same early window — recomputed from the checklist itself rather than
// tracked as a separate flag. Only touches a claim still in that window; never reverts
// a claim that has already moved on to being processed with the insurer.
function recomputeEarlyStatus(claims: Claim[], checklistItems: ChecklistItem[], claimId: string): Claim[] {
  return claims.map((c) => {
    if (c.id !== claimId) return c;
    if (c.status !== "submitted" && c.status !== "documents_outstanding") return c;
    const hasOutstanding = checklistItems.some((item) => item.claimId === claimId && item.status === "outstanding");
    return { ...c, status: hasOutstanding ? "documents_outstanding" : "submitted", updatedAt: nowIso() };
  });
}

// Stage order 4→7 (Submitted to Insurer → Under Assessment → Assessment Completed →
// Awaiting Insurer Decision) — one "advance" action steps the claim to the next milestone.
export const ASSESSMENT_SEQUENCE: ClaimStatus[] = [
  "submitted_to_insurer",
  "under_assessment",
  "assessment_completed",
  "awaiting_insurer_decision",
];

function nextAssessmentStatus(current: ClaimStatus): ClaimStatus | null {
  const index = ASSESSMENT_SEQUENCE.indexOf(current);
  if (index === -1 || index === ASSESSMENT_SEQUENCE.length - 1) return null;
  return ASSESSMENT_SEQUENCE[index + 1];
}

// A settled claim's resting status while awaiting money to move, per its settlement method.
function awaitingSettlementStatus(decision: Decision, hasSignedAol: boolean): ClaimStatus {
  if (decision.settlementMethod === "cash") {
    return hasSignedAol ? "awaiting_insurer_payment" : "awaiting_signed_aol";
  }
  return "awaiting_excess_invoice_and_pop";
}

// ---- Action types ------------------------------------------------------------

type Action =
  | {
      type: "SUBMIT_CLAIM";
      payload: {
        id: string;
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
        actorRole: Role;
      };
    }
  | { type: "SAVE_CLAIM_FORM"; payload: { claimId: string; values: Record<string, string>; actorId: string; actorRole: Role } }
  | {
      type: "UPLOAD_DOCUMENT";
      payload: { claimId: string; docType: DocumentType; filename: string; uploadedById: string; actorRole: Role; checklistItemId?: string };
    }
  | { type: "MARK_CHECKLIST_RECEIVED"; payload: { claimId: string; checklistItemId: string; actorRole: Role; actorId: string } }
  | { type: "PROCESS_TO_INSURER"; payload: { claimId: string; insurerClaimNo: string; assessor?: Assessor; actorId: string; actorRole: Role } }
  | { type: "ADVANCE_ASSESSMENT"; payload: { claimId: string; actorId: string; actorRole: Role } }
  | { type: "MARK_DISPUTED"; payload: { claimId: string; actorId: string; actorRole: Role } }
  | { type: "RESOLVE_DISPUTE"; payload: { claimId: string; actorId: string; actorRole: Role } }
  | { type: "UPDATE_FINANCIALS"; payload: { claimId: string; grossAmount: number; actorId: string; actorRole: Role } }
  | { type: "UPDATE_LATE_MOTIVATION"; payload: { claimId: string; motivation: string; actorId: string; actorRole: Role } }
  | { type: "RECORD_DECISION"; payload: { claimId: string; decision: Omit<Decision, "decidedAt" | "decidedById">; actorId: string; actorRole: Role } }
  | { type: "CLOSE_CLAIM"; payload: { claimId: string; actorId: string; actorRole: Role } }
  | { type: "REOPEN_CLAIM"; payload: { claimId: string; actorId: string; actorRole: Role } }
  | { type: "ADD_MESSAGE"; payload: { claimId: string; authorId: string; authorRole: Role; body: string } }
  | { type: "ADD_COMMENT"; payload: { claimId: string; authorId: string; authorRole: Role; body: string } }
  | {
      type: "ADD_CLIENT";
      payload: {
        client: Omit<ClientOrg, "id" | "createdAt" | "primaryContactId">;
        primaryContact: { name: string; email: string };
        actorId: string;
        actorRole: Role;
      };
    }
  | {
      type: "ADD_POLICY";
      payload: {
        policy: Omit<Policy, "id" | "sections"> & { sections: Omit<PolicySection, "id" | "policyId">[] };
        actorId: string;
        actorRole: Role;
      };
    }
  | { type: "ADD_ASSET"; payload: { asset: Omit<Asset, "id">; actorId: string; actorRole: Role } }
  | { type: "ADD_USER"; payload: { user: Omit<User, "id" | "active">; actorId: string; actorRole: Role } }
  | { type: "SET_USER_ACTIVE"; payload: { userId: string; active: boolean } }
  | { type: "ADD_REPORT"; payload: { report: Omit<ReportRecord, "id" | "generatedAt"> } }
  | { type: "UPDATE_COMPANY_SETTINGS"; payload: Partial<CompanySettings> }
  | { type: "RESET_TO_SEED" }
  | { type: "HYDRATE"; payload: MockState };

function reducer(state: MockState, action: Action): MockState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;

    case "RESET_TO_SEED":
      return buildSeedState();

    case "SUBMIT_CLAIM": {
      const p = action.payload;
      const id = p.id;
      const lossDate = new Date(p.dateOfLoss);
      const ageDays = (Date.now() - lossDate.getTime()) / (1000 * 60 * 60 * 24);
      const lateReported = ageDays > LATE_REPORT_DAYS;

      const claim: Claim = {
        id,
        reference: nextClaimReference(state),
        clientId: p.clientId,
        policyId: p.policyId,
        sectionId: p.sectionId,
        assetId: p.assetId,
        claimType: p.claimType,
        dateOfLoss: p.dateOfLoss,
        location: p.location,
        narrative: p.narrative,
        lodgementChannel: p.lodgementChannel,
        lodgedById: p.lodgedById,
        brokerId: p.brokerId,
        status: "partially_submitted",
        lateReported,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      let auditEntries = audit(state.auditEntries, {
        claimId: id,
        clientId: p.clientId,
        actorId: p.lodgedById,
        actorRole: p.actorRole,
        action: p.lodgementChannel === "self_service" ? "Claim lodged (self-service)" : "Claim lodged (broker-assisted)",
      });
      auditEntries = audit(auditEntries, {
        claimId: id,
        clientId: p.clientId,
        actorId: "system",
        actorRole: p.actorRole,
        action: "Insurer notified by email (FR-14)",
      });
      if (lateReported) {
        auditEntries = audit(auditEntries, {
          claimId: id,
          clientId: p.clientId,
          actorId: "system",
          actorRole: p.actorRole,
          action: "Late-reported flag raised (date of loss more than 30 days ago)",
        });
      }

      return {
        ...state,
        claims: [...state.claims, claim],
        checklistItems: [...state.checklistItems, ...defaultChecklist(id)],
        auditEntries,
      };
    }

    case "SAVE_CLAIM_FORM": {
      const { claimId, values, actorId, actorRole } = action.payload;
      let claims = state.claims.map((c) =>
        c.id === claimId
          ? {
              ...c,
              claimFormValues: { ...(c.claimFormValues ?? {}), ...values },
              status: c.status === "partially_submitted" ? ("submitted" as ClaimStatus) : c.status,
              updatedAt: nowIso(),
            }
          : c,
      );
      claims = recomputeEarlyStatus(claims, state.checklistItems, claimId);
      const claim = claims.find((c) => c.id === claimId);
      // Regeneration replaces the existing claim_form document in place — per §6.11
      // this should read as "download current form," not a growing pile of past
      // versions each time the user revisits this screen.
      const existingClaimFormDoc = state.documents.find((d) => d.claimId === claimId && d.type === "claim_form");
      const refreshedDoc: ClaimDocument = {
        id: existingClaimFormDoc?.id ?? uid("doc"),
        claimId,
        type: "claim_form",
        filename: `${claim?.reference ?? claimId}-claim-form.pdf`,
        uploadedById: actorId,
        uploadedAt: nowIso(),
      };
      const documents: ClaimDocument[] = existingClaimFormDoc
        ? state.documents.map((d) => (d.id === existingClaimFormDoc.id ? refreshedDoc : d))
        : [...state.documents, refreshedDoc];
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim?.clientId,
        actorId,
        actorRole,
        action: "Insurer claim form saved and downloaded",
      });
      return { ...state, claims, documents, auditEntries };
    }

    case "UPLOAD_DOCUMENT": {
      const { claimId, docType, filename, uploadedById, actorRole, checklistItemId } = action.payload;
      const doc: ClaimDocument = {
        id: uid("doc"),
        claimId,
        type: docType,
        filename,
        uploadedById,
        uploadedAt: nowIso(),
        checklistItemId,
      };
      const checklistItems = state.checklistItems.map((item) =>
        item.id === checklistItemId ? { ...item, status: "received" as const, documentId: doc.id } : item,
      );
      let claims = recomputeEarlyStatus(state.claims, checklistItems, claimId);
      // Stage 12 → 14: a signed AOL received on a cash settlement means the Insurer
      // now owes the payout — advance straight to "Awaiting Insurer Payment".
      if (docType === "signed_aol") {
        claims = claims.map((c) => (c.id === claimId && c.status === "awaiting_signed_aol" ? { ...c, status: "awaiting_insurer_payment", updatedAt: nowIso() } : c));
      }
      const claim = claims.find((c) => c.id === claimId);
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim?.clientId,
        actorId: uploadedById,
        actorRole,
        action: `Document uploaded (${docType.replace(/_/g, " ")})`,
      });
      return { ...state, documents: [...state.documents, doc], checklistItems, claims, auditEntries };
    }

    case "MARK_CHECKLIST_RECEIVED": {
      const { claimId, checklistItemId, actorId, actorRole } = action.payload;
      const checklistItems = state.checklistItems.map((item) =>
        item.id === checklistItemId ? { ...item, status: "received" as const } : item,
      );
      const claims = recomputeEarlyStatus(state.claims, checklistItems, claimId);
      const claim = claims.find((c) => c.id === claimId);
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim?.clientId,
        actorId,
        actorRole,
        action: "Checklist item marked received",
      });
      return { ...state, checklistItems, claims, auditEntries };
    }

    case "PROCESS_TO_INSURER": {
      const { claimId, insurerClaimNo, assessor, actorId, actorRole } = action.payload;
      const claims = state.claims.map((c) =>
        c.id === claimId
          ? { ...c, insurerClaimNo, assessor: assessor ?? c.assessor, status: "submitted_to_insurer" as ClaimStatus, updatedAt: nowIso() }
          : c,
      );
      const claim = claims.find((c) => c.id === claimId);
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim?.clientId,
        actorId,
        actorRole,
        action: `Forwarded to insurer — claim number ${insurerClaimNo} recorded`,
      });
      return { ...state, claims, auditEntries };
    }

    case "ADVANCE_ASSESSMENT": {
      const { claimId, actorId, actorRole } = action.payload;
      const claim = state.claims.find((c) => c.id === claimId);
      if (!claim) return state;
      const next = nextAssessmentStatus(claim.status);
      if (!next) return state;
      const claims = state.claims.map((c) => (c.id === claimId ? { ...c, status: next, updatedAt: nowIso() } : c));
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim.clientId,
        actorId,
        actorRole,
        action: `Claim moved to "${STATUS_META[next].label}"`,
      });
      return { ...state, claims, auditEntries };
    }

    case "MARK_DISPUTED": {
      const { claimId, actorId, actorRole } = action.payload;
      const claim = state.claims.find((c) => c.id === claimId);
      if (!claim || claim.status === "disputed") return state;
      const claims = state.claims.map((c) => (c.id === claimId ? { ...c, status: "disputed" as ClaimStatus, preDisputeStatus: c.status, updatedAt: nowIso() } : c));
      const auditEntries = audit(state.auditEntries, { claimId, clientId: claim.clientId, actorId, actorRole, action: "Claim marked as Disputed" });
      return { ...state, claims, auditEntries };
    }

    case "RESOLVE_DISPUTE": {
      const { claimId, actorId, actorRole } = action.payload;
      const claim = state.claims.find((c) => c.id === claimId);
      if (!claim || claim.status !== "disputed") return state;
      const restored = claim.preDisputeStatus ?? "awaiting_insurer_decision";
      const claims = state.claims.map((c) => (c.id === claimId ? { ...c, status: restored, preDisputeStatus: undefined, updatedAt: nowIso() } : c));
      const auditEntries = audit(state.auditEntries, { claimId, clientId: claim.clientId, actorId, actorRole, action: "Dispute resolved" });
      return { ...state, claims, auditEntries };
    }

    case "UPDATE_FINANCIALS": {
      const { claimId, grossAmount, actorId, actorRole } = action.payload;
      const claims = state.claims.map((c) => (c.id === claimId ? { ...c, grossAmount, updatedAt: nowIso() } : c));
      const claim = claims.find((c) => c.id === claimId);
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim?.clientId,
        actorId,
        actorRole,
        action: "Financials updated",
      });
      return { ...state, claims, auditEntries };
    }

    case "UPDATE_LATE_MOTIVATION": {
      const { claimId, motivation, actorId, actorRole } = action.payload;
      const claims = state.claims.map((c) => (c.id === claimId ? { ...c, lateReportedMotivation: motivation, updatedAt: nowIso() } : c));
      const claim = claims.find((c) => c.id === claimId);
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim?.clientId,
        actorId,
        actorRole,
        action: "Late-reported motivation added",
      });
      return { ...state, claims, auditEntries };
    }

    case "RECORD_DECISION": {
      const { claimId, decision, actorId, actorRole } = action.payload;
      if (decision.outcome === "repudiated" && !decision.repudiationReason) {
        return state; // guarded in UI too — never save a repudiation without a reason (FR-23)
      }
      const nextStatus: ClaimStatus =
        decision.outcome === "repudiated"
          ? "repudiated"
          : decision.outcome === "within_excess"
            ? "within_excess"
            : decision.outcome === "not_taken_up"
              ? "not_taken_up"
              : awaitingSettlementStatus(decision as Decision, false);

      const full: Decision = { ...decision, decidedAt: nowIso(), decidedById: actorId };
      const claims = state.claims.map((c) => (c.id === claimId ? { ...c, decision: full, status: nextStatus, updatedAt: nowIso() } : c));
      const claim = claims.find((c) => c.id === claimId);
      const outcomeLabel =
        decision.outcome === "settled"
          ? `Settled (${decision.settlementMethod === "cash" ? "Cash" : decision.settlementMethod === "repair" ? "Repair" : "Replacement"})`
          : decision.outcome === "repudiated"
            ? "Repudiated"
            : decision.outcome === "not_taken_up"
              ? "Not Taken Up"
              : "Within Excess";
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim?.clientId,
        actorId,
        actorRole,
        action: `Insurer decision recorded — ${outcomeLabel}`,
      });
      return { ...state, claims, auditEntries };
    }

    case "CLOSE_CLAIM": {
      const { claimId, actorId, actorRole } = action.payload;
      const claim = state.claims.find((c) => c.id === claimId);
      if (!claim) return state;
      const blockers = closeBlockersFor(claim, state.documents);
      if (blockers.length > 0) return state; // UI should never dispatch this while blocked
      const claims = state.claims.map((c) => (c.id === claimId ? { ...c, status: "closed" as ClaimStatus, updatedAt: nowIso() } : c));
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim.clientId,
        actorId,
        actorRole,
        action: "Claim closed",
      });
      return { ...state, claims, auditEntries };
    }

    case "REOPEN_CLAIM": {
      const { claimId, actorId, actorRole } = action.payload;
      const claim = state.claims.find((c) => c.id === claimId);
      if (!claim) return state;
      const hasSignedAol = state.documents.some((d) => d.claimId === claimId && d.type === "signed_aol");
      const revertStatus: ClaimStatus = claim.decision
        ? claim.decision.outcome === "repudiated"
          ? "repudiated"
          : claim.decision.outcome === "within_excess"
            ? "within_excess"
            : claim.decision.outcome === "not_taken_up"
              ? "not_taken_up"
              : awaitingSettlementStatus(claim.decision, hasSignedAol)
        : "awaiting_insurer_decision";
      const claims = state.claims.map((c) => (c.id === claimId ? { ...c, status: revertStatus, updatedAt: nowIso() } : c));
      const auditEntries = audit(state.auditEntries, {
        claimId,
        clientId: claim.clientId,
        actorId,
        actorRole,
        action: "Claim reopened",
      });
      return { ...state, claims, auditEntries };
    }

    case "ADD_MESSAGE": {
      const { claimId, authorId, authorRole, body } = action.payload;
      const message: Message = { id: uid("msg"), claimId, authorId, authorRole, body, createdAt: nowIso() };
      return { ...state, messages: [...state.messages, message] };
    }

    case "ADD_COMMENT": {
      const { claimId, authorId, authorRole, body } = action.payload;
      const comment: CommentEntry = { id: uid("cmt"), claimId, authorId, authorRole, body, createdAt: nowIso() };
      return { ...state, comments: [...state.comments, comment] };
    }

    case "ADD_CLIENT": {
      const { client, primaryContact, actorId, actorRole } = action.payload;
      const id = uid("c");
      const contactUser: User = { id: uid("u"), name: primaryContact.name, email: primaryContact.email, role: "client_primary", clientId: id, active: true };
      const newClient: ClientOrg = { ...client, id, primaryContactId: contactUser.id, createdAt: nowIso() };
      const auditEntries = audit(state.auditEntries, { clientId: id, actorId, actorRole, action: "Client record created" });
      return { ...state, clients: [...state.clients, newClient], users: [...state.users, contactUser], auditEntries };
    }

    case "ADD_POLICY": {
      const { policy, actorId, actorRole } = action.payload;
      const id = uid("p");
      const newPolicy: Policy = { ...policy, id, sections: policy.sections.map((s) => ({ ...s, id: uid("s"), policyId: id })) };
      const auditEntries = audit(state.auditEntries, { clientId: policy.clientId, actorId, actorRole, action: "Policy added" });
      return { ...state, policies: [...state.policies, newPolicy], auditEntries };
    }

    case "ADD_ASSET": {
      const { asset, actorId, actorRole } = action.payload;
      const newAsset: Asset = { ...asset, id: uid("a") };
      const auditEntries = audit(state.auditEntries, { actorId, actorRole, action: `Asset registered — ${asset.description}` });
      return { ...state, assets: [...state.assets, newAsset], auditEntries };
    }

    case "ADD_USER": {
      const { user, actorId, actorRole } = action.payload;
      const newUser: User = { ...user, id: uid("u"), active: true };
      const auditEntries = audit(state.auditEntries, { actorId, actorRole, action: `User created — ${newUser.name} (${newUser.role})` });
      return { ...state, users: [...state.users, newUser], auditEntries };
    }

    case "SET_USER_ACTIVE": {
      const { userId, active } = action.payload;
      return { ...state, users: state.users.map((u) => (u.id === userId ? { ...u, active } : u)) };
    }

    case "ADD_REPORT": {
      const report: ReportRecord = { ...action.payload.report, id: uid("rpt"), generatedAt: nowIso() };
      return { ...state, reports: [...state.reports, report] };
    }

    case "UPDATE_COMPANY_SETTINGS":
      return { ...state, companySettings: { ...state.companySettings, ...action.payload } };

    default:
      return state;
  }
}

// ---- Close-claim gating (ux-blueprint.md §3.4/§3.2 — name the missing item, don't just disable) ----

export function closeBlockersFor(claim: Claim, documents: ClaimDocument[]): string[] {
  const blockers: string[] = [];
  if (!claim.decision) {
    blockers.push("No insurer decision has been recorded yet.");
    return blockers;
  }
  if (claim.decision.outcome === "repudiated" && !claim.decision.repudiationReason) {
    blockers.push("Repudiation reason is missing from the recorded decision.");
  }
  if (claim.decision.outcome === "settled") {
    if (claim.decision.settlementMethod === "cash") {
      const hasProofOfPayment = documents.some((d) => d.claimId === claim.id && d.type === "proof_of_payment");
      if (!hasProofOfPayment) blockers.push("Proof of Payment from the insurer has not been uploaded yet.");
    } else {
      const hasProofOfPayment = documents.some((d) => d.claimId === claim.id && d.type === "proof_of_payment");
      if (!hasProofOfPayment) blockers.push("The client's proof of excess payment has not been uploaded yet.");
    }
  }
  return blockers;
}

// ---- Context -------------------------------------------------------------------

interface DataContextValue {
  state: MockState;
  ready: boolean;
  submitClaim: (payload: Omit<Extract<Action, { type: "SUBMIT_CLAIM" }>["payload"], "id">) => string;
  saveClaimForm: (payload: Extract<Action, { type: "SAVE_CLAIM_FORM" }>["payload"]) => void;
  uploadDocument: (payload: Extract<Action, { type: "UPLOAD_DOCUMENT" }>["payload"]) => void;
  markChecklistReceived: (payload: Extract<Action, { type: "MARK_CHECKLIST_RECEIVED" }>["payload"]) => void;
  processToInsurer: (payload: Extract<Action, { type: "PROCESS_TO_INSURER" }>["payload"]) => void;
  advanceAssessment: (payload: Extract<Action, { type: "ADVANCE_ASSESSMENT" }>["payload"]) => void;
  markDisputed: (payload: Extract<Action, { type: "MARK_DISPUTED" }>["payload"]) => void;
  resolveDispute: (payload: Extract<Action, { type: "RESOLVE_DISPUTE" }>["payload"]) => void;
  updateFinancials: (payload: Extract<Action, { type: "UPDATE_FINANCIALS" }>["payload"]) => void;
  updateLateMotivation: (payload: Extract<Action, { type: "UPDATE_LATE_MOTIVATION" }>["payload"]) => void;
  recordDecision: (payload: Extract<Action, { type: "RECORD_DECISION" }>["payload"]) => void;
  closeClaim: (payload: Extract<Action, { type: "CLOSE_CLAIM" }>["payload"]) => void;
  reopenClaim: (payload: Extract<Action, { type: "REOPEN_CLAIM" }>["payload"]) => void;
  addMessage: (payload: Extract<Action, { type: "ADD_MESSAGE" }>["payload"]) => void;
  addComment: (payload: Extract<Action, { type: "ADD_COMMENT" }>["payload"]) => void;
  addClient: (payload: Extract<Action, { type: "ADD_CLIENT" }>["payload"]) => void;
  addPolicy: (payload: Extract<Action, { type: "ADD_POLICY" }>["payload"]) => void;
  addAsset: (payload: Extract<Action, { type: "ADD_ASSET" }>["payload"]) => void;
  addUser: (payload: Extract<Action, { type: "ADD_USER" }>["payload"]) => void;
  setUserActive: (userId: string, active: boolean) => void;
  addReport: (report: Omit<ReportRecord, "id" | "generatedAt">) => void;
  updateCompanySettings: (payload: Partial<CompanySettings>) => void;
  resetToSeed: () => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, buildSeedState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "HYDRATE", payload: JSON.parse(raw) as MockState });
    } catch {
      // corrupt/unavailable storage — fall back to seed state already in memory
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable (private browsing, quota) — prototype still works in-memory
    }
  }, [state, ready]);

  const value = useMemo<DataContextValue>(
    () => ({
      state,
      ready,
      submitClaim: (payload) => {
        const id = uid("cl");
        dispatch({ type: "SUBMIT_CLAIM", payload: { ...payload, id } });
        return id;
      },
      saveClaimForm: (payload) => dispatch({ type: "SAVE_CLAIM_FORM", payload }),
      uploadDocument: (payload) => dispatch({ type: "UPLOAD_DOCUMENT", payload }),
      markChecklistReceived: (payload) => dispatch({ type: "MARK_CHECKLIST_RECEIVED", payload }),
      processToInsurer: (payload) => dispatch({ type: "PROCESS_TO_INSURER", payload }),
      advanceAssessment: (payload) => dispatch({ type: "ADVANCE_ASSESSMENT", payload }),
      markDisputed: (payload) => dispatch({ type: "MARK_DISPUTED", payload }),
      resolveDispute: (payload) => dispatch({ type: "RESOLVE_DISPUTE", payload }),
      updateFinancials: (payload) => dispatch({ type: "UPDATE_FINANCIALS", payload }),
      updateLateMotivation: (payload) => dispatch({ type: "UPDATE_LATE_MOTIVATION", payload }),
      recordDecision: (payload) => dispatch({ type: "RECORD_DECISION", payload }),
      closeClaim: (payload) => dispatch({ type: "CLOSE_CLAIM", payload }),
      reopenClaim: (payload) => dispatch({ type: "REOPEN_CLAIM", payload }),
      addMessage: (payload) => dispatch({ type: "ADD_MESSAGE", payload }),
      addComment: (payload) => dispatch({ type: "ADD_COMMENT", payload }),
      addClient: (payload) => dispatch({ type: "ADD_CLIENT", payload }),
      addPolicy: (payload) => dispatch({ type: "ADD_POLICY", payload }),
      addAsset: (payload) => dispatch({ type: "ADD_ASSET", payload }),
      addUser: (payload) => dispatch({ type: "ADD_USER", payload }),
      setUserActive: (userId, active) => dispatch({ type: "SET_USER_ACTIVE", payload: { userId, active } }),
      addReport: (report) => dispatch({ type: "ADD_REPORT", payload: { report } }),
      updateCompanySettings: (payload) => dispatch({ type: "UPDATE_COMPANY_SETTINGS", payload }),
      resetToSeed: () => dispatch({ type: "RESET_TO_SEED" }),
    }),
    [state, ready],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}

// ---- Scoping helpers (ux-blueprint.md §3.3) -------------------------------------

export function useScopedClaims(role: Role, userId: string, clientId?: string): Claim[] {
  const { state } = useData();
  return useMemo(() => {
    if (role === "administrator" || role === "manager") return state.claims;
    if (role === "broker") return state.claims.filter((c) => c.brokerId === userId);
    return state.claims.filter((c) => c.clientId === clientId);
  }, [state.claims, role, userId, clientId]);
}

export function useScopedClients(role: Role, userId: string, clientId?: string): ClientOrg[] {
  const { state } = useData();
  return useMemo(() => {
    // Client & Policy directory: Broker/Manager/Administrator see everyone (§3.3) —
    // only the Claims list is own-clients-only for a Broker.
    if (role === "client_primary" || role === "client_secondary") {
      return state.clients.filter((c) => c.id === clientId);
    }
    return state.clients;
  }, [state.clients, role, clientId]);
}

/**
 * Claim-creation client picker — per ux-blueprint.md §3.3, a Broker's claims list AND
 * claim-creation client-picker are own-clients-only; the "everyone, view-only for
 * others" rule is a named exception specific to the Client & Policy directory
 * (useScopedClients above), not this picker. UC-15 states the same restriction.
 */
export function useOwnClients(role: Role, userId: string): ClientOrg[] {
  const { state } = useData();
  return useMemo(() => {
    if (role === "administrator" || role === "manager") return state.clients;
    return state.clients.filter((c) => c.brokerId === userId);
  }, [state.clients, role, userId]);
}

export function canEditClient(role: Role, userId: string, client: ClientOrg): boolean {
  if (role === "administrator" || role === "manager") return true;
  if (role === "broker") return client.brokerId === userId;
  return false;
}
