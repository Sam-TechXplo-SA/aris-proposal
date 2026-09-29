"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { documentsFor, formatDateTime } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import type { DocumentType } from "@/lib/mock/types";
import { useParams } from "next/navigation";
import { useState } from "react";

function ClientUploadRow({ label, docType, claimId, existing, buttonLabel }: { label: string; docType: DocumentType; claimId: string; existing?: { filename: string; uploadedAt: string }; buttonLabel: string }) {
  const { currentUser } = useAuth();
  const { uploadDocument } = useData();
  const [file, setFile] = useState<File | null>(null);

  if (existing) {
    return (
      <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 dark:border-success-500/30 dark:bg-success-500/10">
        <p className="text-theme-sm font-medium text-success-700 dark:text-success-400">{label}</p>
        <p className="text-theme-xs text-success-600/80 dark:text-success-400/70">
          {existing.filename} · {formatDateTime(existing.uploadedAt)}
        </p>
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

export default function ClientClaimSettlementPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state } = useData();
  if (!claim || !claim.decision || claim.decision.outcome !== "settled") return null;

  const documents = documentsFor(state, claim.id);
  const findDoc = (type: DocumentType) => documents.find((d) => d.type === type);
  const isCash = claim.decision.settlementMethod === "cash";

  return (
    <div className="space-y-6">
      {isCash ? (
        <ComponentCard title="Agreement of Loss" desc="Your claim was settled in cash. Download, sign, and upload the Agreement of Loss below.">
          <div className="space-y-3">
            {findDoc("unsigned_aol") ? (
              <div className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Unsigned Agreement of Loss</p>
                <p className="text-theme-xs text-gray-400">{findDoc("unsigned_aol")!.filename}</p>
                <a
                  download
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="mt-1 inline-block text-theme-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Download to sign
                </a>
              </div>
            ) : (
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">Your Broker hasn&apos;t issued the Agreement of Loss yet.</p>
            )}
            {findDoc("unsigned_aol") && (
              <ClientUploadRow label="Signed Agreement of Loss" docType="signed_aol" claimId={claim.id} existing={findDoc("signed_aol")} buttonLabel="Upload signed AOL" />
            )}
            {findDoc("signed_aol") && (
              <ClientUploadRow label="Proof of Payment (from Insurer)" docType="proof_of_payment" claimId={claim.id} existing={findDoc("proof_of_payment")} buttonLabel="Upload proof of payment" />
            )}
          </div>
        </ComponentCard>
      ) : (
        <ComponentCard title="Excess Invoice" desc="Your claim was settled by repair/replacement. Pay the excess invoice and upload proof of payment below.">
          <div className="space-y-3">
            {findDoc("excess_invoice") ? (
              <div className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Excess Invoice</p>
                <p className="text-theme-xs text-gray-400">{findDoc("excess_invoice")!.filename}</p>
              </div>
            ) : (
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">Your Broker hasn&apos;t issued the excess invoice yet.</p>
            )}
            {findDoc("excess_invoice") && (
              <ClientUploadRow label="Proof of Payment (excess)" docType="proof_of_payment" claimId={claim.id} existing={findDoc("proof_of_payment")} buttonLabel="Upload proof of payment" />
            )}
          </div>
        </ComponentCard>
      )}
    </div>
  );
}
