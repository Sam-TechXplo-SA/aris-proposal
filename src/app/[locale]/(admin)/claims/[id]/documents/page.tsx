"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { DownloadIcon, FileIcon } from "@/icons";
import { checklistFor, documentsFor, formatDateTime } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import type { DocumentType } from "@/lib/mock/types";
import { useParams } from "next/navigation";
import { useState } from "react";

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "photo", label: "Photograph" },
  { value: "police_report", label: "Police Report" },
  { value: "incident_report", label: "Incident Report" },
  { value: "unsigned_aol", label: "Unsigned Agreement of Loss" },
  { value: "signed_aol", label: "Signed Agreement of Loss" },
  { value: "proof_of_payment", label: "Proof of Payment" },
  { value: "excess_invoice", label: "Excess Invoice" },
  { value: "repudiation_letter", label: "Repudiation Letter" },
  { value: "policy_schedule", label: "Policy Schedule" },
  { value: "other", label: "Other" },
];

export default function ClaimDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, uploadDocument, markChecklistReceived } = useData();
  const { currentUser } = useAuth();
  const [checklistItemId, setChecklistItemId] = useState("");
  const [docType, setDocType] = useState<DocumentType>("other");
  const [file, setFile] = useState<File | null>(null);

  if (!claim || !currentUser) return null;

  const checklist = checklistFor(state, claim.id);
  const documents = documentsFor(state, claim.id);

  function handleUpload() {
    if (!file) return;
    uploadDocument({
      claimId: claim!.id,
      docType,
      filename: file.name,
      uploadedById: currentUser!.id,
      actorRole: currentUser!.role,
      checklistItemId: checklistItemId || undefined,
    });
    setFile(null);
    setChecklistItemId("");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <ComponentCard title="Checklist" desc="Advisory — never blocks anything else on the claim.">
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2.5">
                <span className="text-theme-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                {item.status === "received" ? (
                  <span className="text-theme-xs font-medium text-success-600 dark:text-success-400">Received</span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => markChecklistReceived({ claimId: claim.id, checklistItemId: item.id, actorId: currentUser.id, actorRole: currentUser.role })}>
                    Mark received
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </ComponentCard>

        <ComponentCard title="All Documents">
          {documents.length === 0 ? (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/5">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <FileIcon className="size-5 text-gray-400" />
                    <div>
                      <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{doc.filename}</p>
                      <p className="text-theme-xs text-gray-400">
                        {DOC_TYPE_OPTIONS.find((o) => o.value === doc.type)?.label ?? doc.type} · {formatDateTime(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <DownloadIcon className="size-4 text-gray-400" />
                </li>
              ))}
            </ul>
          )}
        </ComponentCard>
      </div>

      <ComponentCard title="Upload Document">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Document type</label>
            <Select
              options={DOC_TYPE_OPTIONS}
              defaultValue={docType}
              onChange={(v) => setDocType(v as DocumentType)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">Satisfies checklist item (optional)</label>
            <Select
              options={[{ value: "", label: "Ad-hoc — not on the checklist" }, ...checklist.filter((c) => c.status === "outstanding").map((c) => ({ value: c.id, label: c.label }))]}
              defaultValue=""
              onChange={setChecklistItemId}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-theme-sm text-gray-600 file:me-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-theme-sm file:font-medium file:text-brand-600 dark:text-gray-300 dark:file:bg-brand-500/15 dark:file:text-brand-400"
            />
          </div>
          <Button size="sm" className="w-full" disabled={!file} onClick={handleUpload}>
            Upload
          </Button>
        </div>
      </ComponentCard>
    </div>
  );
}
