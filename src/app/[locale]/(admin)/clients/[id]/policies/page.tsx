"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Link } from "@/i18n/navigation";
import { PlusIcon } from "@/icons";
import { formatCurrency, formatDate } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useParams } from "next/navigation";

export default function ClientPoliciesPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useData();
  const policies = state.policies.filter((p) => p.clientId === id);

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <Link href={`/clients/${id}/assets/new`}>
          <Button size="sm" variant="outline" startIcon={<PlusIcon className="size-4" />}>
            New Asset
          </Button>
        </Link>
        <Link href={`/clients/${id}/policies/new`}>
          <Button size="sm" startIcon={<PlusIcon className="size-4" />}>
            New Policy
          </Button>
        </Link>
      </div>

      {policies.length === 0 ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">No policies on file for this client yet.</p>
      ) : (
        policies.map((policy) => (
          <ComponentCard key={policy.id} title={policy.policyNumber} desc={`${formatDate(policy.periodStart)} — ${formatDate(policy.periodEnd)}`}>
            <div className="space-y-4">
              {policy.sections.map((section) => {
                const assets = state.assets.filter((a) => a.sectionId === section.id);
                return (
                  <div key={section.id} className="rounded-lg border border-gray-100 p-3 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                        {section.name} — {section.insurer}
                      </p>
                      <p className="text-theme-xs text-gray-400">Excess {formatCurrency(section.excess)}</p>
                    </div>
                    {section.requiresAsset && (
                      <ul className="mt-2 list-inside list-disc text-theme-xs text-gray-500 dark:text-gray-400">
                        {assets.length === 0 ? <li>No assets registered.</li> : assets.map((a) => <li key={a.id}>{a.description}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </ComponentCard>
        ))
      )}
    </div>
  );
}
