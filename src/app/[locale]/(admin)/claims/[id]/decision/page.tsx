"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ConfirmModal from "@/components/common/ConfirmModal";
import Radio from "@/components/form/input/Radio";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { Link } from "@/i18n/navigation";
import { documentsFor, formatDateTime } from "@/lib/mock/helpers";
import { statusLabel } from "@/lib/mock/status";
import { closeBlockersFor, useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import type { DecisionOutcome, DocumentType, SettlementMethod } from "@/lib/mock/types";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import { useState } from "react";

function UploadRow({
  label,
  docType,
  claimId,
  existing,
  buttonLabel,
}: {
  label: string;
  docType: DocumentType;
  claimId: string;
  existing?: { filename: string; uploadedAt: string };
  buttonLabel: string;
}) {
  const { currentUser } = useAuth();
  const { uploadDocument } = useData();
  const [file, setFile] = useState<File | null>(null);

  if (existing) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-success-200 bg-success-50 px-4 py-3 dark:border-success-500/30 dark:bg-success-500/10">
        <div>
          <p className="text-theme-sm font-medium text-success-700 dark:text-success-400">{label}</p>
          <p className="text-theme-xs text-success-600/80 dark:text-success-400/70">
            {existing.filename} · {formatDateTime(existing.uploadedAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
      <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-theme-sm text-gray-600 file:me-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-theme-xs file:font-medium file:text-brand-600 dark:text-gray-300 dark:file:bg-brand-500/15 dark:file:text-brand-400"
        />
        <Button
          size="sm"
          disabled={!file || !currentUser}
          onClick={() => {
            if (!file || !currentUser) return;
            uploadDocument({ claimId, docType, filename: file.name, uploadedById: currentUser.id, actorRole: currentUser.role });
            setFile(null);
          }}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

export default function ClaimDecisionPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, recordDecision, closeClaim, reopenClaim, markDisputed, resolveDispute } = useData();
  const { currentUser } = useAuth();

  const [outcome, setOutcome] = useState<DecisionOutcome>("settled");
  const [method, setMethod] = useState<SettlementMethod>("cash");
  const [reason, setReason] = useState("");
  const decisionConfirm = useModal();
  const closeConfirm = useModal();
  const reopenConfirm = useModal();

  if (!claim || !currentUser) return null;

  const documents = documentsFor(state, claim.id);
  const findDoc = (type: DocumentType) => documents.find((d) => d.type === type);
  const blockers = closeBlockersFor(claim, state.documents);
  const canReopen = currentUser.role === "administrator";

  if (!claim.insurerClaimNo) {
    return (
      <Alert
        variant="info"
        title="Forward to the insurer first"
        message="Record the insurer's claim number on the Insurer & Assessor tab before capturing their decision."
      />
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {!claim.decision ? (
        <ComponentCard title="Record Insurer Decision" desc="Select the outcome the insurer communicated (by email, offline).">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-6">
              <Radio id="outcome-settled" name="outcome" value="settled" checked={outcome === "settled"} onChange={() => setOutcome("settled")} label="Settled" />
              <Radio id="outcome-repudiated" name="outcome" value="repudiated" checked={outcome === "repudiated"} onChange={() => setOutcome("repudiated")} label="Repudiated" />
              <Radio id="outcome-excess" name="outcome" value="within_excess" checked={outcome === "within_excess"} onChange={() => setOutcome("within_excess")} label="Within Excess" />
              <Radio id="outcome-ntu" name="outcome" value="not_taken_up" checked={outcome === "not_taken_up"} onChange={() => setOutcome("not_taken_up")} label="Not Taken Up" />
            </div>

            {outcome === "repudiated" && (
              <div>
                <Label>
                  Repudiation Reason <span className="text-error-500">*</span>
                </Label>
                <TextArea rows={3} value={reason} onChange={setReason} placeholder="Required — the claim cannot be saved as Repudiated without this." />
              </div>
            )}

            {outcome === "settled" && (
              <div>
                <Label>Settlement Method</Label>
                <div className="flex flex-wrap gap-6">
                  <Radio id="method-cash" name="method" value="cash" checked={method === "cash"} onChange={() => setMethod("cash")} label="Cash" />
                  <Radio id="method-repair" name="method" value="repair" checked={method === "repair"} onChange={() => setMethod("repair")} label="Repair" />
                  <Radio id="method-replacement" name="method" value="replacement" checked={method === "replacement"} onChange={() => setMethod("replacement")} label="Replacement" />
                </div>
              </div>
            )}

            <Button size="sm" disabled={outcome === "repudiated" && !reason.trim()} onClick={decisionConfirm.openModal}>
              Record Decision
            </Button>
          </div>
        </ComponentCard>
      ) : (
        <>
          <ComponentCard title="Insurer Decision">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-theme-xs text-gray-400">Outcome</dt>
                <dd className="text-theme-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {claim.decision.outcome === "within_excess"
                    ? "Within Excess"
                    : claim.decision.outcome === "not_taken_up"
                      ? "Not Taken Up"
                      : claim.decision.outcome}
                  {claim.decision.settlementMethod ? ` (${claim.decision.settlementMethod})` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-theme-xs text-gray-400">Decided</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{formatDateTime(claim.decision.decidedAt)}</dd>
              </div>
              {claim.decision.repudiationReason && (
                <div className="col-span-2">
                  <dt className="text-theme-xs text-gray-400">Repudiation Reason</dt>
                  <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{claim.decision.repudiationReason}</dd>
                </div>
              )}
              {claim.decision.notes && (
                <div className="col-span-2">
                  <dt className="text-theme-xs text-gray-400">Notes</dt>
                  <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{claim.decision.notes}</dd>
                </div>
              )}
            </dl>
          </ComponentCard>

          {claim.decision.outcome === "repudiated" && (
            <ComponentCard title="Repudiation Letter">
              <UploadRow label="Repudiation letter" docType="repudiation_letter" claimId={claim.id} existing={findDoc("repudiation_letter")} buttonLabel="Upload letter" />
            </ComponentCard>
          )}

          {claim.decision.outcome === "within_excess" && (
            <Alert variant="info" title="No settlement action required" message="The loss falls within the policy excess — no invoicing or AOL cycle arises on this path." />
          )}

          {claim.decision.outcome === "not_taken_up" && (
            <Alert variant="info" title="Claim withdrawn" message="The client elected not to proceed with this claim — no further settlement action arises." />
          )}

          {claim.decision.outcome === "settled" && (
            <ComponentCard title="Dispute">
              {claim.status === "disputed" ? (
                <div className="flex items-center justify-between">
                  <p className="text-theme-sm text-gray-600 dark:text-gray-300">
                    This claim is flagged as disputed — liaise with the client offline, then resolve to return it to{" "}
                    <span className="font-medium">{statusLabel(claim.preDisputeStatus ?? "awaiting_insurer_decision")}</span>.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => resolveDispute({ claimId: claim.id, actorId: currentUser.id, actorRole: currentUser.role })}>
                    Resolve Dispute
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-theme-sm text-gray-600 dark:text-gray-300">Flag this claim if the client disputes the AOL amount or settlement.</p>
                  <Button size="sm" variant="outline" onClick={() => markDisputed({ claimId: claim.id, actorId: currentUser.id, actorRole: currentUser.role })}>
                    Mark as Disputed
                  </Button>
                </div>
              )}
            </ComponentCard>
          )}

          {claim.decision.outcome === "settled" && claim.decision.settlementMethod === "cash" && (
            <ComponentCard title="Agreement of Loss (Cash Settlement)">
              <div className="space-y-3">
                <UploadRow label="Unsigned Agreement of Loss (issued to client)" docType="unsigned_aol" claimId={claim.id} existing={findDoc("unsigned_aol")} buttonLabel="Issue AOL" />
                {findDoc("unsigned_aol") &&
                  (findDoc("signed_aol") ? (
                    <UploadRow label="Signed Agreement of Loss" docType="signed_aol" claimId={claim.id} existing={findDoc("signed_aol")} buttonLabel="Record signed AOL" />
                  ) : (
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400">Awaiting the client to download, sign, and upload the Agreement of Loss.</p>
                  ))}
                {findDoc("signed_aol") && (
                  <UploadRow label="Proof of Payment (from Insurer)" docType="proof_of_payment" claimId={claim.id} existing={findDoc("proof_of_payment")} buttonLabel="Record Proof of Payment" />
                )}
              </div>
            </ComponentCard>
          )}

          {claim.decision.outcome === "settled" && claim.decision.settlementMethod !== "cash" && (
            <ComponentCard title="Excess Invoice (Repair / Replacement Settlement)">
              <div className="space-y-3">
                <UploadRow label="Excess invoice (issued to client)" docType="excess_invoice" claimId={claim.id} existing={findDoc("excess_invoice")} buttonLabel="Issue Invoice" />
                {findDoc("excess_invoice") &&
                  (findDoc("proof_of_payment") ? (
                    <p className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-theme-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
                      Proof of payment received — forward it to the service provider by email.
                    </p>
                  ) : (
                    <p className="text-theme-sm text-gray-500 dark:text-gray-400">Awaiting the client&apos;s proof of excess payment.</p>
                  ))}
              </div>
            </ComponentCard>
          )}
        </>
      )}

      <ComponentCard title="Claim Closure">
        {claim.status === "closed" ? (
          <div className="flex items-center justify-between">
            <p className="text-theme-sm text-gray-600 dark:text-gray-300">This claim is closed. Comments can still be added.</p>
            {canReopen && (
              <Button size="sm" variant="outline" onClick={reopenConfirm.openModal}>
                Reopen Claim
              </Button>
            )}
          </div>
        ) : blockers.length > 0 ? (
          <div>
            <p className="mb-2 text-theme-sm font-medium text-gray-700 dark:text-gray-300">This claim can&apos;t be closed yet:</p>
            <ul className="list-inside list-disc space-y-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <Link href={`/claims/${claim.id}/documents`} className="mt-3 inline-block text-theme-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Go to Documents →
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-theme-sm text-gray-600 dark:text-gray-300">Every requirement for closure is on file.</p>
            <Button size="sm" onClick={closeConfirm.openModal}>
              Close Claim
            </Button>
          </div>
        )}
      </ComponentCard>

      <ConfirmModal
        isOpen={decisionConfirm.isOpen}
        onClose={decisionConfirm.closeModal}
        title="Record this decision?"
        description="This is financially and legally consequential — later correction requires an audit-logged edit."
        confirmLabel="Record Decision"
        onConfirm={() =>
          recordDecision({
            claimId: claim.id,
            decision: {
              outcome,
              repudiationReason: outcome === "repudiated" ? reason.trim() : undefined,
              settlementMethod: outcome === "settled" ? method : undefined,
            },
            actorId: currentUser.id,
            actorRole: currentUser.role,
          })
        }
      />
      <ConfirmModal
        isOpen={closeConfirm.isOpen}
        onClose={closeConfirm.closeModal}
        title="Close this claim?"
        description="The claim will lock to view-only + comments for the client, and is retained a minimum of 5 years."
        confirmLabel="Close Claim"
        tone="error"
        onConfirm={() => closeClaim({ claimId: claim.id, actorId: currentUser.id, actorRole: currentUser.role })}
      />
      <ConfirmModal
        isOpen={reopenConfirm.isOpen}
        onClose={reopenConfirm.closeModal}
        title="Reopen this claim?"
        description="This is a rare, high-sensitivity action against a compliance-retained record."
        confirmLabel="Reopen Claim"
        tone="error"
        onConfirm={() => reopenClaim({ claimId: claim.id, actorId: currentUser.id, actorRole: currentUser.role })}
      />
    </div>
  );
}
