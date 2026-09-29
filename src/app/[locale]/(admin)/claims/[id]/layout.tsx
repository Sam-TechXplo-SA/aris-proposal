"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import NotFoundPanel from "@/components/common/NotFoundPanel";
import ChangeStatusModal from "@/components/claims/ChangeStatusModal";
import StatusBadge from "@/components/claims/StatusBadge";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { Link } from "@/i18n/navigation";
import Tabs from "@/components/ui/tabs/Tabs";
import { AlertIcon, ChevronRightIcon } from "@/icons";
import { findClient, findUser, findSection, formatDate } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { INTERNAL_ROLES } from "@/lib/mock/types";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";

export default function ClaimDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { claim, notFound } = useClaimAccess(id);
  const { state, setStatus } = useData();
  const { currentUser } = useAuth();
  const statusModal = useModal();
  const pathname = usePathname();

  if (notFound || !claim) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Claim" />
        <NotFoundPanel backHref="/claims" />
      </div>
    );
  }

  const client = findClient(state, claim.clientId);
  const section = findSection(state, claim.sectionId);
  const base = `/claims/${claim.id}`;

  const tabs = [
    { key: "overview", label: "Overview", href: base },
    { key: "claim-form", label: "Claim Form", href: `${base}/claim-form` },
    { key: "documents", label: "Documents", href: `${base}/documents` },
    { key: "insurer-assessor", label: "Insurer & Assessor", href: `${base}/insurer-assessor` },
    { key: "decision", label: "Decision & Settlement", href: `${base}/decision` },
    { key: "financials", label: "Financials", href: `${base}/financials` },
    { key: "communication", label: "Communication", href: `${base}/communication` },
    { key: "comments", label: "Comments", href: `${base}/comments` },
    { key: "activity", label: "Activity", href: `${base}/activity` },
  ];
  const active =
    [...tabs]
      .sort((a, b) => b.href.length - a.href.length)
      .find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.key ?? "overview";

  const broker = findUser(state, claim.brokerId);
  // Any internal user may override the status; a closed claim can only be moved by an Administrator (reopen rule).
  const canChangeStatus =
    !!currentUser && INTERNAL_ROLES.includes(currentUser.role) && (claim.status !== "closed" || currentUser.role === "administrator");
  const facts = [
    { label: "Client", value: client?.name, href: `/clients/${claim.clientId}` },
    { label: "Insurer", value: section?.insurer },
    { label: "Section", value: section?.name },
    { label: "Broker", value: broker?.name },
    { label: "Date of loss", value: formatDate(claim.dateOfLoss) },
    { label: "Insurer claim no.", value: claim.insurerClaimNo ?? "Not yet issued" },
  ];

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-theme-xs text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-gray-800 dark:hover:text-gray-200">Home</Link>
        <ChevronRightIcon className="size-3 text-gray-300 rtl:rotate-180 dark:text-gray-600" />
        <Link href="/claims" className="hover:text-gray-800 dark:hover:text-gray-200">Claims</Link>
        <ChevronRightIcon className="size-3 text-gray-300 rtl:rotate-180 dark:text-gray-600" />
        <span className="text-gray-700 dark:text-gray-300">{claim.reference}</span>
      </nav>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white">{claim.reference}</h1>
              <StatusBadge status={claim.status} />
              {claim.lateReported && (
                <span className="inline-flex items-center gap-1 rounded-md bg-warning-50 px-2 py-0.5 text-theme-xs font-medium text-warning-700 ring-1 ring-warning-600/20 ring-inset dark:bg-warning-500/15 dark:text-warning-300">
                  <AlertIcon className="size-3" /> Late reported
                </span>
              )}
            </div>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
              {claim.claimType} · {claim.location}
            </p>
          </div>
          {canChangeStatus && (
            <Button size="sm" variant="outline" onClick={statusModal.openModal}>
              Change status
            </Button>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-gray-100 px-5 py-4 sm:grid-cols-3 xl:grid-cols-6 dark:border-gray-800">
          {facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-[11px] font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">{f.label}</dt>
              <dd className="mt-1 truncate text-theme-sm font-medium text-gray-900 dark:text-white/90">
                {f.href ? (
                  <Link href={f.href} className="hover:text-brand-600">
                    {f.value ?? "—"}
                  </Link>
                ) : (
                  (f.value ?? "—")
                )}
              </dd>
            </div>
          ))}
        </dl>

        <Tabs tabs={tabs} active={active} className="border-t border-b-0 border-gray-100 px-5 dark:border-gray-800" />
      </div>

      {children}

      {canChangeStatus && (
        <ChangeStatusModal
          isOpen={statusModal.isOpen}
          onClose={statusModal.closeModal}
          current={claim.status}
          onSave={(status, note) => setStatus({ claimId: claim.id, status, note, actorId: currentUser.id, actorRole: currentUser.role })}
        />
      )}
    </div>
  );
}
