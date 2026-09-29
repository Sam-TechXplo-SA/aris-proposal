"use client";

import NotFoundPanel from "@/components/common/NotFoundPanel";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Tabs from "@/components/ui/tabs/Tabs";
import { usePathname } from "@/i18n/navigation";
import { useData } from "@/lib/mock/store";
import { useParams } from "next/navigation";

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { state } = useData();
  const pathname = usePathname();
  const client = state.clients.find((c) => c.id === id);

  if (!client) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Client" />
        <NotFoundPanel backHref="/clients" />
      </div>
    );
  }

  const base = `/clients/${client.id}`;
  const tabs = [
    { key: "org", label: "Organisation & Contacts", href: base },
    { key: "policies", label: "Policies", href: `${base}/policies` },
    { key: "claims", label: "Claims", href: `${base}/claims` },
    { key: "activity", label: "Activity", href: `${base}/activity` },
  ];
  // Longest-href-first so a sub-page like /policies/new or /assets/new still highlights
  // its parent tab, instead of falling through to "org" (the only exact-match candidate).
  // Assets live conceptually under Policies (an asset always belongs to a policy
  // section), so /assets/* also highlights the Policies tab.
  const active =
    pathname.startsWith(`${base}/assets`)
      ? "policies"
      : ([...tabs].sort((a, b) => b.href.length - a.href.length).find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.key ?? "org");

  return (
    <div>
      <PageBreadcrumb pageTitle={client.name} />
      <Tabs tabs={tabs} active={active} className="mb-6" />
      {children}
    </div>
  );
}
