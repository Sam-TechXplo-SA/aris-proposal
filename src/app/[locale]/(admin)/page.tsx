"use client";

import ClaimsTable from "@/components/claims/ClaimsTable";
import ComponentCard from "@/components/common/ComponentCard";
import StatCard from "@/components/common/StatCard";
import ClaimsActivityCharts from "@/components/dashboard/ClaimsActivityCharts";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { AlertIcon, ChevronRightIcon, FolderIcon, GroupIcon, ListIcon, PlugInIcon, PlusIcon, TimeIcon, UserIcon } from "@/icons";
import { findClient, findUser, needsAttentionClaims, sortClaimsByAttention } from "@/lib/mock/helpers";
import { useData, useScopedClaims } from "@/lib/mock/store";

function DashboardHeader({ name, subtitle, showNewClaim = true }: { name: string; subtitle: string; showNewClaim?: boolean }) {
  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">{today}</p>
        <h1 className="mt-1 text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white">Welcome back, {name.split(" ")[0]}</h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      {showNewClaim && (
        <Link href="/claims/new">
          <Button size="sm" startIcon={<PlusIcon className="size-4" />}>
            New Claim
          </Button>
        </Link>
      )}
    </div>
  );
}

const viewAll = (
  <Link href="/claims" className="inline-flex items-center gap-0.5 text-theme-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
    View all claims <ChevronRightIcon className="size-3.5 rtl:rotate-180" />
  </Link>
);

// ux-blueprint.md §13 — role-varying dashboards. Deliberately no charts/vanity metrics
// (§13.4: "if a number can only be produced by running a report, it's report content,
// not dashboard content") — every tile here is a live, actionable filter/count.
export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const { state } = useData();
  const role = currentUser?.role ?? "broker";
  const ownClaims = useScopedClaims(role, currentUser?.id ?? "", currentUser?.clientId);

  if (!currentUser) return null;

  if (role === "administrator") {
    const attention = needsAttentionClaims(state.claims);
    const adminLinks = [
      { href: "/users", label: "Users & Access", desc: "Accounts, roles and MFA", icon: <UserIcon /> },
      { href: "/settings/products", label: "Product & Document Configuration", desc: "Insurer forms and checklists", icon: <FolderIcon /> },
      { href: "/settings/company", label: "Company & Report Settings", desc: "Branding, statuses, reminders", icon: <PlugInIcon /> },
    ];
    return (
      <div className="space-y-6">
        <DashboardHeader name={currentUser.name} subtitle="Cross-broker overview across every client." showNewClaim={false} />
        <ClaimsActivityCharts state={state} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Claims needing attention" value={attention.length} hint="Across all brokers" icon={<AlertIcon />} tone="attention" href="/claims" />
          <StatCard label="Late-reported claims" value={state.claims.filter((c) => c.lateReported).length} hint="Reported 30+ days after loss" icon={<TimeIcon />} href="/claims" />
          <StatCard label="Clients on file" value={state.clients.length} hint={`${state.policies.length} active policies`} icon={<GroupIcon />} href="/clients" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {adminLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-card transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300 [&_svg]:size-4.5">{l.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-theme-sm font-medium text-gray-900 dark:text-white/90">{l.label}</span>
                <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{l.desc}</span>
              </span>
              <ChevronRightIcon className="size-4 text-gray-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </Link>
          ))}
        </div>
        <ComponentCard title="Needs attention" desc="Claims waiting on a broker or client action." action={viewAll} flush>
          <ClaimsTable claims={attention} showBrokerColumn framed={false} emptyMessage="Nothing currently needs attention." />
        </ComponentCard>
      </div>
    );
  }

  if (role === "manager") {
    const attention = needsAttentionClaims(state.claims);
    const byBroker = new Map<string, number>();
    attention.forEach((c) => byBroker.set(c.brokerId, (byBroker.get(c.brokerId) ?? 0) + 1));
    const max = Math.max(1, ...byBroker.values());
    return (
      <div className="space-y-6">
        <DashboardHeader name={currentUser.name} subtitle="Portfolio-level exception view, across every broker." showNewClaim={false} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ComponentCard title="Queues by broker" desc="Where stepping in would help most." className="lg:col-span-1">
            <ul className="space-y-4">
              {[...byBroker.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([brokerId, count]) => (
                  <li key={brokerId}>
                    <div className="flex items-center justify-between text-theme-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{findUser(state, brokerId)?.name}</span>
                      <span className="text-gray-500 tabular-nums dark:text-gray-400">{count} open</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-white/5">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </li>
                ))}
              {byBroker.size === 0 && <li className="text-theme-sm text-gray-400">No claims currently need attention.</li>}
            </ul>
          </ComponentCard>
          <ComponentCard title="Needs attention" desc="All brokers" action={viewAll} flush className="lg:col-span-2">
            <ClaimsTable claims={attention} showBrokerColumn framed={false} emptyMessage="Nothing currently needs attention." />
          </ComponentCard>
        </div>
      </div>
    );
  }

  // Broker: the dashboard IS the sorted claims queue (§13.3).
  const sorted = sortClaimsByAttention(ownClaims);
  const attention = needsAttentionClaims(ownClaims);
  // eslint-disable-next-line react-hooks/purity -- a dashboard tile snapshotting "now" for a display count is fine outside the compiler
  const lateThisWeek = ownClaims.filter((c) => c.lateReported && Date.now() - new Date(c.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const clientIds = [...new Set(ownClaims.map((c) => c.clientId))];

  return (
    <div className="space-y-6">
      <DashboardHeader name={currentUser.name} subtitle="Your claims, sorted by what needs action." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Claims need action" value={attention.length} hint={`Of ${ownClaims.length} claims assigned to you`} icon={<AlertIcon />} tone="attention" href="/claims" />
        <StatCard label="Late-reported this week" value={lateThisWeek} hint="Reported 30+ days after loss" icon={<TimeIcon />} />
        <StatCard label="Assigned clients" value={clientIds.length} hint="With at least one claim" icon={<GroupIcon />} href="/clients" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <ComponentCard title="My claims" desc="Sorted by what needs attention first." action={viewAll} flush className="xl:col-span-3">
          <ClaimsTable claims={sorted} framed={false} emptyMessage="No claims assigned to you yet." />
        </ComponentCard>
        <ComponentCard title="Assigned clients" flush className="xl:col-span-1 xl:self-start">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {clientIds.map((cid) => {
              const client = findClient(state, cid);
              const count = ownClaims.filter((c) => c.clientId === cid).length;
              return (
                <li key={cid}>
                  <Link href={`/clients/${cid}`} className="flex items-center justify-between gap-3 px-5 py-3 text-theme-sm hover:bg-gray-50 dark:hover:bg-white/3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <ListIcon className="size-4 shrink-0 text-gray-400" />
                      <span className="truncate text-gray-800 dark:text-gray-200">{client?.name}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-theme-xs font-medium text-gray-600 tabular-nums dark:bg-white/5 dark:text-gray-400">{count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </ComponentCard>
      </div>
    </div>
  );
}
