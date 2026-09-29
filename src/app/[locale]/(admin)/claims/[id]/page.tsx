"use client";

import ClaimProgress from "@/components/claims/ClaimProgress";
import ComponentCard from "@/components/common/ComponentCard";
import TextArea from "@/components/form/input/TextArea";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { checklistFor, findAsset, findClient, findPolicy, findSection, findUser, formatDate, formatDateTime } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ClaimOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, updateLateMotivation } = useData();
  const { currentUser } = useAuth();
  const [motivation, setMotivation] = useState(claim?.lateReportedMotivation ?? "");
  if (!claim || !currentUser) return null;

  const client = findClient(state, claim.clientId);
  const policy = findPolicy(state, claim.policyId);
  const section = findSection(state, claim.sectionId);
  const asset = findAsset(state, claim.assetId);
  const lodgedBy = findUser(state, claim.lodgedById);
  const broker = findUser(state, claim.brokerId);
  const checklist = checklistFor(state, claim.id);
  const outstanding = checklist.filter((c) => c.status === "outstanding");
  const claimFormStarted = !!claim.claimFormValues && Object.keys(claim.claimFormValues).length > 0;

  return (
    <div>
      <ClaimProgress claim={claim} />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {claim.lateReported && (
            <ComponentCard title="Late Reported" desc="The Insurer may reject this claim on this basis (UC-11) — record why, for the file.">
              <div className="space-y-3">
                <TextArea rows={2} value={motivation} onChange={setMotivation} placeholder="Why was this claim reported more than 30 days after the date of loss?" />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!motivation.trim() || motivation.trim() === claim.lateReportedMotivation}
                  onClick={() => updateLateMotivation({ claimId: claim.id, motivation: motivation.trim(), actorId: currentUser.id, actorRole: currentUser.role })}
                >
                  Save Motivation
                </Button>
              </div>
            </ComponentCard>
          )}
          {(claim.status === "repudiated" || claim.status === "within_excess" || claim.status === "not_taken_up") && (
            <Alert
              variant="info"
              title="No action needed from the client"
              message={
                claim.status === "repudiated"
                  ? "The claim was repudiated by the insurer. The client has been notified; no further client action is required on this claim."
                  : claim.status === "not_taken_up"
                    ? "The client elected not to proceed with this claim. No further action is required."
                    : "The loss falls within the policy excess and no payment arises. The client has been notified; no further action is required."
              }
            />
          )}
          {claim.status === "disputed" && (
            <Alert variant="warning" title="Disputed" message="This claim has been flagged as disputed — see Decision & Settlement for details." />
          )}

          <ComponentCard title="Claim Form" desc={claimFormStarted ? "In progress — the client or broker can pick up where it was left off." : "Not started yet."}>
            <div className="flex items-center justify-between">
              <span className="text-theme-sm text-gray-700 dark:text-gray-300">{claimFormStarted ? "In progress" : "Not started"}</span>
              <Link href={`/claims/${claim.id}/claim-form`} className="text-theme-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                {claimFormStarted ? "Continue filling form →" : "Open claim form →"}
              </Link>
            </div>
          </ComponentCard>

          <ComponentCard title="Loss Details">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-theme-xs text-gray-400">Date of Loss</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{formatDate(claim.dateOfLoss)}</dd>
              </div>
              <div>
                <dt className="text-theme-xs text-gray-400">Location</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{claim.location}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-theme-xs text-gray-400">Narrative</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{claim.narrative}</dd>
              </div>
            </dl>
          </ComponentCard>

          <ComponentCard title="Policy &amp; Cover">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-theme-xs text-gray-400">Policy</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{policy?.policyNumber}</dd>
              </div>
              <div>
                <dt className="text-theme-xs text-gray-400">Section</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">
                  {section?.name} — {section?.insurer}
                </dd>
              </div>
              {asset && (
                <div className="sm:col-span-2">
                  <dt className="text-theme-xs text-gray-400">Asset</dt>
                  <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{asset.description}</dd>
                </div>
              )}
            </dl>
          </ComponentCard>

          <ComponentCard title="Document Checklist" desc="Advisory — an outstanding item never blocks other actions on this claim.">
            <ul className="divide-y divide-gray-100 dark:divide-white/5">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-2.5">
                  <span className="text-theme-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span
                    className={
                      item.status === "received"
                        ? "text-theme-xs font-medium text-success-600 dark:text-success-400"
                        : "text-theme-xs font-medium text-gray-400"
                    }
                  >
                    {item.status === "received" ? "Received" : "Outstanding"}
                  </span>
                </li>
              ))}
            </ul>
            <Link href={`/claims/${claim.id}/documents`} className="mt-3 inline-block text-theme-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Manage documents →
            </Link>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Lodgement">
            <dl className="space-y-3">
              <div>
                <dt className="text-theme-xs text-gray-400">Client</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{client?.name}</dd>
              </div>
              <div>
                <dt className="text-theme-xs text-gray-400">Channel</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">
                  {claim.lodgementChannel === "self_service" ? "Client self-service" : "Broker-assisted"}
                </dd>
              </div>
              <div>
                <dt className="text-theme-xs text-gray-400">Lodged by</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{lodgedBy?.name}</dd>
              </div>
              <div>
                <dt className="text-theme-xs text-gray-400">Assigned Broker</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{broker?.name}</dd>
              </div>
              <div>
                <dt className="text-theme-xs text-gray-400">Lodged</dt>
                <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{formatDateTime(claim.createdAt)}</dd>
              </div>
            </dl>
          </ComponentCard>

          {outstanding.length > 0 && (
            <ComponentCard title="Needs Attention">
              <ul className="space-y-2">
                {outstanding.map((item) => (
                  <li key={item.id} className="text-theme-sm text-gray-600 dark:text-gray-300">
                    {item.label}
                  </li>
                ))}
              </ul>
            </ComponentCard>
          )}
        </div>
      </div>
    </div>
  );
}
