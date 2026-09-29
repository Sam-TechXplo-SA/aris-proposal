"use client";

import ClientStageTracker from "@/components/claims/ClientStageTracker";
import ComponentCard from "@/components/common/ComponentCard";
import Alert from "@/components/ui/alert/Alert";
import { Link } from "@/i18n/navigation";
import { auditFor, checklistFor, clientAttentionFor, documentsFor, formatDateTime } from "@/lib/mock/helpers";
import { clientStageNote } from "@/lib/mock/clientStatus";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";

export default function ClientClaimStatusPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state } = useData();
  if (!claim) return null;

  const documents = documentsFor(state, claim.id);
  const attention = clientAttentionFor(claim, state.documents);
  const timeline = auditFor(state, { claimId: claim.id });
  const checklist = checklistFor(state, claim.id);
  const claimFormStarted = !!claim.claimFormValues && Object.keys(claim.claimFormValues).length > 0;

  return (
    <div className="space-y-6">
      <ComponentCard title="Progress">
        <ClientStageTracker status={claim.status} blocking={clientStageNote(state, claim).blocking} />
        <p className="mt-5 text-theme-sm text-gray-600 dark:text-gray-300">{clientStageNote(state, claim).text}</p>
      </ComponentCard>
      {claim.lateReported && (
        <Alert
          variant="warning"
          title="Late Reported"
          message="This claim was reported more than 30 days after the date of loss, which the Insurer may consider grounds for rejection."
        />
      )}
      {(claim.status === "repudiated" || claim.status === "within_excess" || claim.status === "not_taken_up") && (
        <Alert
          variant="info"
          title="No action needed"
          message={
            claim.status === "repudiated"
              ? "The insurer has repudiated this claim. There is nothing further for you to do here."
              : claim.status === "not_taken_up"
                ? "This claim was withdrawn. There is nothing further for you to do here."
                : "This loss falls within your policy excess, so no payment arises. There is nothing further for you to do here."
          }
        />
      )}
      {attention && <Alert variant="warning" title="Action needed" message={attention} />}

      <ComponentCard title="Claim Form" desc={claimFormStarted ? "In progress — pick up where you or your broker left off." : "Not started yet."}>
        <div className="flex items-center justify-between">
          <span className="text-theme-sm text-gray-700 dark:text-gray-300">{claimFormStarted ? "In progress" : "Not started"}</span>
          <Link href={`/portal/claims/${claim.id}/claim-form`} className="text-theme-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            {claimFormStarted ? "Continue filling form →" : "Start claim form →"}
          </Link>
        </div>
      </ComponentCard>

      <ComponentCard title="Timeline">
        <ol className="relative space-y-6 ps-6">
          <span className="absolute top-1 bottom-1 start-[7px] w-px bg-gray-200 dark:bg-gray-800" />
          {timeline.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -start-6 top-1 size-3.5 rounded-full border-2 border-white bg-brand-500 dark:border-gray-900" />
              <p className="text-theme-sm text-gray-700 dark:text-gray-300">{entry.action}</p>
              <p className="text-theme-xs text-gray-400">{formatDateTime(entry.createdAt)}</p>
            </li>
          ))}
        </ol>
      </ComponentCard>

      <ComponentCard title="Document Checklist" desc="Advisory only.">
        <ul className="divide-y divide-gray-100 dark:divide-white/5">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-2.5">
              <span className="text-theme-sm text-gray-700 dark:text-gray-300">{item.label}</span>
              <span className={item.status === "received" ? "text-theme-xs font-medium text-success-600 dark:text-success-400" : "text-theme-xs font-medium text-gray-400"}>
                {item.status === "received" ? "Received" : "Outstanding"}
              </span>
            </li>
          ))}
        </ul>
      </ComponentCard>

      {documents.length > 0 && (
        <ComponentCard title="Your Documents">
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between py-2.5">
                <span className="text-theme-sm text-gray-700 dark:text-gray-300">{doc.filename}</span>
                <span className="text-theme-xs text-gray-400">{formatDateTime(doc.uploadedAt)}</span>
              </li>
            ))}
          </ul>
        </ComponentCard>
      )}
    </div>
  );
}
