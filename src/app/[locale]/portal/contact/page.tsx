"use client";

import ClientStatusPill from "@/components/claims/ClientStatusPill";
import { initialsOf } from "@/components/header/ClientUserMenu";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { MailIcon } from "@/icons";
import { clientClaimTitle } from "@/lib/mock/clientStatus";
import { findClient, findUser } from "@/lib/mock/helpers";
import { useData, useScopedClaims } from "@/lib/mock/store";

// The org's assigned Broker, and a shortcut into each open claim's message thread —
// messages sent there are kept on the claim record for both sides.
export default function ClientContactBrokerPage() {
  const { currentUser } = useAuth();
  const { state } = useData();
  const claims = useScopedClaims(currentUser?.role ?? "client_primary", currentUser?.id ?? "", currentUser?.clientId);
  if (!currentUser) return null;

  const org = findClient(state, currentUser.clientId);
  const broker = findUser(state, org?.brokerId);
  const openClaims = claims.filter((c) => c.status !== "closed").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white/90">Contact Broker</h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Your dedicated broker at {state.companySettings.companyName}</p>
      </div>

      {broker && (
        <section className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-theme-sm font-semibold text-white dark:bg-white dark:text-gray-900">
            {initialsOf(broker.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-800 dark:text-white/90">{broker.name}</p>
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">Claims broker · {org?.name}</p>
          </div>
          <a
            href={`mailto:${broker.email}`}
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-theme-sm font-medium text-gray-700 ring-1 ring-gray-200 ring-inset hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5"
          >
            <MailIcon className="size-4" /> {broker.email}
          </a>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-theme-sm font-semibold text-gray-800 dark:text-white/90">Message about a claim</h2>
        {openClaims.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">You have no open claims.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-card dark:divide-gray-800 dark:border-gray-800 dark:bg-white/3">
            {openClaims.map((claim) => (
              <li key={claim.id}>
                <Link href={`/portal/claims/${claim.id}/communication`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-theme-sm font-medium text-gray-800 dark:text-white/90">{clientClaimTitle(state, claim)}</p>
                    <p className="text-theme-xs text-gray-500 dark:text-gray-400">{claim.reference}</p>
                  </div>
                  <ClientStatusPill status={claim.status} />
                  <span className="hidden text-theme-xs font-medium text-gray-600 sm:inline dark:text-gray-300">Message →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
