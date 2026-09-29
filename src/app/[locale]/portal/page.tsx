"use client";

import ClientClaimCard from "@/components/claims/ClientClaimCard";
import StatCard from "@/components/common/StatCard";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import {
  AlertIcon,
  CheckCircleIcon,
  ListIcon,
  PlusIcon,
  TimeIcon,
} from "@/icons";
import { clientStageNote, clientStageOf } from "@/lib/mock/clientStatus";
import { findClient } from "@/lib/mock/helpers";
import { useData, useScopedClaims } from "@/lib/mock/store";
import type { Claim, MockState } from "@/lib/mock/types";
import { cn } from "@/utils";
import { useState } from "react";

// The claim the client most needs to act on — opened by default so the full stage view
// is visible on arrival. Outstanding documents win; then any other claim waiting on the
// client; otherwise nothing is expanded.
function mostActionableClaim(
  state: MockState,
  claims: Claim[],
): Claim | undefined {
  const blocking = claims.filter((c) => clientStageNote(state, c).blocking);
  return (
    blocking.find((c) => clientStageOf(c.status) === "documents_outstanding") ??
    blocking[0]
  );
}

type Filter = "all" | "action" | "open" | "finalised";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

// User Portal home — UC-03 Track Claim Status. The org's claims, most recently lodged
// first, each showing the client-facing status the Broker last set. Only claims linked
// to the signed-in user's own organisation are ever listed (useScopedClaims).
export default function ClientDashboardPage() {
  const { currentUser } = useAuth();
  const { state } = useData();
  const claims = useScopedClaims(
    currentUser?.role ?? "client_primary",
    currentUser?.id ?? "",
    currentUser?.clientId,
  );
  // null until the user toggles a card — until then the most actionable claim stays open.
  const [expanded, setExpanded] = useState<Set<string> | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  if (!currentUser) return null;

  const org = findClient(state, currentUser.clientId);
  const sorted = [...claims].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const needsAction = sorted.filter((c) => clientStageNote(state, c).blocking);
  const finalised = sorted.filter(
    (c) => clientStageOf(c.status) === "finalised",
  );
  const open = sorted.filter((c) => clientStageOf(c.status) !== "finalised");
  const withInsurer = sorted.filter(
    (c) => clientStageOf(c.status) === "with_insurer",
  );
  const visible =
    filter === "action"
      ? needsAction
      : filter === "open"
        ? open
        : filter === "finalised"
          ? finalised
          : sorted;
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All claims", count: sorted.length },
    { key: "action", label: "Needs action", count: needsAction.length },
    { key: "open", label: "In progress", count: open.length },
    { key: "finalised", label: "Finalised", count: finalised.length },
  ];
  const defaultOpen = mostActionableClaim(state, sorted);
  const openIds = expanded ?? new Set(defaultOpen ? [defaultOpen.id] : []);

  const toggle = (id: string) => {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            {greeting()}, {currentUser.name.split(" ")[0]}
          </p>
          <h1 className="mt-0.5 text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white/90">
            My Claims
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {org?.name} · {claims.length}{" "}
            {claims.length === 1 ? "claim" : "claims"} on file
          </p>
        </div>
        <Link href="/portal/claims/new" className="sm:hidden">
          <Button size="sm" startIcon={<PlusIcon className="size-4" />}>
            Lodge a Claim
          </Button>
        </Link>
      </div>

      {claims.length > 0 && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Needs your action"
            value={needsAction.length}
            hint={
              needsAction.length
                ? "Documents or signatures outstanding"
                : "Nothing outstanding"
            }
            icon={<AlertIcon />}
            tone={needsAction.length ? "attention" : "default"}
          />
          <StatCard
            label="In progress"
            value={open.length}
            hint="Received, with your broker or insurer"
            icon={<ListIcon />}
          />
          <StatCard
            label="With insurer"
            value={withInsurer.length}
            hint="Being assessed or decided"
            icon={<TimeIcon />}
          />
          <StatCard
            label="Finalised"
            value={finalised.length}
            hint="Closed and view-only"
            icon={<CheckCircleIcon />}
          />
        </div>
      )}

      {claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-white/3">
          <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            No claims yet
          </p>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            When you need to report a loss, lodging your first claim only takes
            a few minutes.
          </p>
          <Link href="/portal/claims/new" className="mt-4 inline-block">
            <Button size="sm">Lodge your first claim</Button>
          </Link>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="no-scrollbar max-w-full overflow-x-auto">
              <div
                role="tablist"
                aria-label="Filter claims"
                className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
              >
                {filters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-theme-sm font-medium whitespace-nowrap transition-colors",
                      filter === f.key
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        "rounded px-1.5 text-theme-xs tabular-nums",
                        filter === f.key
                          ? "bg-white/15 dark:bg-gray-900/10"
                          : f.key === "action" && f.count > 0
                            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15"
                            : "bg-gray-100 text-gray-500 dark:bg-white/5",
                      )}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="hidden text-theme-xs text-gray-500 sm:block dark:text-gray-400">
              Most recently lodged first
            </p>
          </div>
          {visible.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-theme-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900">
              {filter === "action"
                ? "Nothing needs your action right now."
                : "No claims in this view."}
            </p>
          )}
          {visible.map((claim) => (
            <ClientClaimCard
              key={claim.id}
              claim={claim}
              expanded={openIds.has(claim.id)}
              onToggle={() => toggle(claim.id)}
            />
          ))}
        </section>
      )}

      <p className="text-center text-theme-xs text-gray-400 dark:text-gray-500">
        Statuses are updated by your broker as your claim progresses.{" "}
        <Link
          href="/portal/contact"
          className="font-medium text-gray-600 underline underline-offset-2 hover:text-gray-800 dark:text-gray-300"
        >
          Questions? Contact your broker
        </Link>
      </p>
    </div>
  );
}
