"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { FileIcon } from "@/icons";
import { checklistFor, documentsFor, formatDateTime } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ClientClaimDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, uploadDocument } = useData();
  const { currentUser } = useAuth();
  const [checklistItemId, setChecklistItemId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (!claim || !currentUser) return null;

  const checklist = checklistFor(state, claim.id);
  const documents = documentsFor(state, claim.id);
  const outstanding = checklist.filter((c) => c.status === "outstanding");
  const canUpload = claim.status !== "closed";

  return (
    <div className="space-y-6">
      <ComponentCard title="Checklist">
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

      <ComponentCard title="Your Documents">
        {documents.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-3">
                <FileIcon className="size-5 text-gray-400" />
                <div>
                  <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{doc.filename}</p>
                  <p className="text-theme-xs text-gray-400">{formatDateTime(doc.uploadedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ComponentCard>

      {canUpload && (
        <ComponentCard title="Upload a Document">
          <div className="space-y-4">
            <Select
              options={[{ value: "", label: "Ad-hoc — not on the checklist" }, ...outstanding.map((c) => ({ value: c.id, label: c.label }))]}
              defaultValue=""
              onChange={setChecklistItemId}
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-theme-sm text-gray-600 file:me-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-theme-sm file:font-medium file:text-brand-600 dark:text-gray-300 dark:file:bg-brand-500/15 dark:file:text-brand-400"
            />
            <Button
              size="sm"
              className="w-full"
              disabled={!file}
              onClick={() => {
                if (!file) return;
                uploadDocument({ claimId: claim.id, docType: "other", filename: file.name, uploadedById: currentUser.id, actorRole: currentUser.role, checklistItemId: checklistItemId || undefined });
                setFile(null);
              }}
            >
              Upload
            </Button>
          </div>
        </ComponentCard>
      )}
    </div>
  );
}
