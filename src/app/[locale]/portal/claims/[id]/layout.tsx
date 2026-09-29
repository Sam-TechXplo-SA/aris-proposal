"use client";

import NotFoundPanel from "@/components/common/NotFoundPanel";
import ClientStatusPill from "@/components/claims/ClientStatusPill";
import Tabs from "@/components/ui/tabs/Tabs";
import { Link, usePathname } from "@/i18n/navigation";
import { AlertIcon, ChevronLeftIcon } from "@/icons";
import { findSection, formatDate } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";

// Client Claim Detail — a single scrolling record with light sub-nav (not full admin
// tabs), per ux-blueprint.md §8.2/§10.3/§20.2's shallow-app, mobile-first framing.
export default function ClientClaimDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { claim, notFound } = useClaimAccess(id);
  const { state } = useData();
  const pathname = usePathname();

  if (notFound || !claim) {
    return <NotFoundPanel backHref="/portal" backLabel="Back to My Claims" />;
  }

  const section = findSection(state, claim.sectionId);
  const base = `/portal/claims/${claim.id}`;
  const showSettlement = claim.decision?.outcome === "settled";

  const tabs = [
    { key: "status", label: "Status & Timeline", href: base },
    { key: "claim-form", label: "Claim Form", href: `${base}/claim-form` },
    { key: "documents", label: "Documents", href: `${base}/documents` },
    { key: "communication", label: "Communication", href: `${base}/communication` },
    { key: "comment", label: "Comment", href: `${base}/comment` },
    ...(showSettlement ? [{ key: "settlement", label: "Settlement", href: `${base}/settlement` }] : []),
  ];
  const active =
    [...tabs]
      .sort((a, b) => b.href.length - a.href.length)
      .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.key ?? "status";

  return (
    <div>
      <Link href="/portal" className="mb-4 inline-flex items-center gap-1 text-theme-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
        <ChevronLeftIcon className="size-4 rtl:rotate-180" /> My Claims
      </Link>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
        <div className="px-5 pt-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white">{claim.reference}</h1>
            <ClientStatusPill status={claim.status} />
            {claim.lateReported && (
              <span className="inline-flex items-center gap-1 rounded-md bg-warning-50 px-2 py-0.5 text-theme-xs font-medium text-warning-700 ring-1 ring-warning-600/20 ring-inset dark:bg-warning-500/15 dark:text-warning-300">
                <AlertIcon className="size-3" /> Late reported
              </span>
            )}
          </div>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {claim.claimType} · {section?.insurer} · Loss on {formatDate(claim.dateOfLoss)}
          </p>
        </div>
        <Tabs tabs={tabs} active={active} className="mt-4 border-t border-b-0 border-gray-100 px-5 dark:border-gray-800" />
      </div>

      {children}
    </div>
  );
}
