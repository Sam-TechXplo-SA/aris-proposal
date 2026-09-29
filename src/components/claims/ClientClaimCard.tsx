"use client";

import ClientStageTracker from "@/components/claims/ClientStageTracker";
import ClientStatusPill from "@/components/claims/ClientStatusPill";
import { Link } from "@/i18n/navigation";
import { AlertIcon, ChevronDownIcon, InfoIcon, LockIcon } from "@/icons";
import { clientClaimTitle, clientStageNote, clientStageOf } from "@/lib/mock/clientStatus";
import { findSection, formatDate } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import type { Claim } from "@/lib/mock/types";
import { cn } from "@/utils";
import { useId } from "react";

interface ClientClaimCardProps {
  claim: Claim;
  expanded: boolean;
  onToggle: () => void;
}

// One claim in the User Portal's My Claims list (UC-03). Collapsed it's a single row —
// title and reference on the left, client-facing status on the right. Expanded it adds
// the 5-stage tracker and a plain-language line on what's happening or what's needed.
// Status is read-only here: it always reflects the Broker's latest update.
export default function ClientClaimCard({ claim, expanded, onToggle }: ClientClaimCardProps) {
  const { state } = useData();
  const panelId = useId();
  const title = clientClaimTitle(state, claim);
  const stage = clientStageOf(claim.status);
  const finalised = stage === "finalised";
  const note = clientStageNote(state, claim);
  const section = findSection(state, claim.sectionId);
  const base = `/portal/claims/${claim.id}`;

  return (
    <article
      className={cn(
        "rounded-xl border bg-white shadow-card transition-shadow dark:bg-white/3",
        expanded ? "border-gray-300 shadow-theme-sm dark:border-gray-700" : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 px-5 py-4 text-start"
      >
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 max-w-full">
            <h2 className={cn("text-theme-sm font-semibold sm:truncate", finalised ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-white/90")}>
              {title}
            </h2>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium tabular-nums">{claim.reference}</span> · Lodged {formatDate(claim.createdAt)}
            </p>
          </div>
          <ClientStatusPill status={claim.status} />
        </div>
        <ChevronDownIcon className={cn("size-4 shrink-0 text-gray-400 transition-transform", expanded && "rotate-180")} aria-hidden />
      </button>

      {expanded && (
        <div id={panelId} className="border-t border-gray-100 px-5 pt-5 pb-5 dark:border-gray-800">
          <ClientStageTracker status={claim.status} blocking={note.blocking} />

          <p
            className={cn(
              "mt-5 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-theme-sm",
              note.blocking
                ? "bg-warning-50 text-warning-800 dark:bg-warning-500/10 dark:text-warning-200"
                : "bg-gray-50 text-gray-600 dark:bg-white/3 dark:text-gray-300",
            )}
          >
            {note.blocking ? (
              <AlertIcon className="mt-0.5 size-4 shrink-0 text-warning-500" aria-hidden />
            ) : finalised ? (
              <LockIcon className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
            ) : (
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
            )}
            <span>{note.text}</span>
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              {section?.name} · {section?.insurer} · Updated {formatDate(claim.updatedAt)}
            </p>
            <div className="flex items-center gap-2">
              {stage === "documents_outstanding" && note.blocking && (
                <Link
                  href={`${base}/documents`}
                  className="rounded-lg bg-brand-500 px-3.5 py-2 text-theme-xs font-medium text-white shadow-theme-xs hover:bg-brand-600"
                >
                  Upload documents
                </Link>
              )}
              <Link
                href={base}
                className="rounded-lg px-3 py-2 text-theme-xs font-medium text-gray-700 ring-1 ring-gray-200 ring-inset hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5"
              >
                {finalised ? "View claim (read-only)" : "View claim details"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
