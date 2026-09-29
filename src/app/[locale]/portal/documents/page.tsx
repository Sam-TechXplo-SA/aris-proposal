"use client";

import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { AlertIcon, FileIcon } from "@/icons";
import { clientClaimTitle } from "@/lib/mock/clientStatus";
import { findUser, formatDate } from "@/lib/mock/helpers";
import { useData, useScopedClaims } from "@/lib/mock/store";

// Every document on the org's claims in one place, with anything the Broker is still
// waiting on pinned at the top. Uploading happens on each claim's Documents tab.
export default function ClientDocumentsPage() {
  const { currentUser } = useAuth();
  const { state } = useData();
  const claims = useScopedClaims(currentUser?.role ?? "client_primary", currentUser?.id ?? "", currentUser?.clientId);
  if (!currentUser) return null;

  const claimIds = new Set(claims.map((c) => c.id));
  const byId = new Map(claims.map((c) => [c.id, c]));
  const outstanding = state.checklistItems.filter((i) => claimIds.has(i.claimId) && i.status === "outstanding" && byId.get(i.claimId)?.status !== "closed");
  const documents = state.documents.filter((d) => claimIds.has(d.claimId)).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white/90">Documents</h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          {documents.length} {documents.length === 1 ? "file" : "files"} across your claims
        </p>
      </div>

      {outstanding.length > 0 && (
        <section className="rounded-2xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-500/30 dark:bg-warning-500/10">
          <h2 className="flex items-center gap-2 text-theme-sm font-semibold text-warning-800 dark:text-warning-300">
            <AlertIcon className="size-4 text-warning-500" /> Still needed from you
          </h2>
          <ul className="mt-3 divide-y divide-warning-200/70 dark:divide-warning-500/20">
            {outstanding.map((item) => {
              const claim = byId.get(item.claimId)!;
              return (
                <li key={item.id} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{item.label}</p>
                    <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                      {claim.reference} · {clientClaimTitle(state, claim)}
                    </p>
                  </div>
                  <Link
                    href={`/portal/claims/${claim.id}/documents`}
                    className="shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-theme-xs font-medium text-white shadow-theme-xs hover:bg-brand-600"
                  >
                    Upload
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-white/3">
        {documents.length === 0 ? (
          <p className="p-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">No documents yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {documents.map((doc) => {
              const claim = byId.get(doc.claimId)!;
              const uploader = findUser(state, doc.uploadedById);
              return (
                <li key={doc.id}>
                  <Link href={`/portal/claims/${claim.id}/documents`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/3">
                    <FileIcon className="size-5 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{doc.filename}</p>
                      <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
                        {claim.reference} · {clientClaimTitle(state, claim)}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-end sm:block">
                      <p className="text-theme-xs text-gray-500 dark:text-gray-400">{formatDate(doc.uploadedAt)}</p>
                      <p className="text-theme-xs text-gray-400 dark:text-gray-500">{uploader?.name}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
