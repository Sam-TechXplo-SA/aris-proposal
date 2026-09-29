"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { useData, useScopedClients } from "@/lib/mock/store";
import type { ReportType } from "@/lib/mock/types";
import { useState } from "react";

// ux-blueprint.md §6.7 — every calculated field (loss ratio, underwriting year, net
// claim, progress classification) would be computed server-side; here we just record
// the generation request, since there's no backend to compile the workbook.
export default function GenerateReportPage() {
  const { currentUser } = useAuth();
  const { state, addReport } = useData();
  const role = currentUser?.role ?? "broker";
  const clients = useScopedClients(role, currentUser?.id ?? "", currentUser?.clientId);

  const [type, setType] = useState<ReportType>("claims_history");
  const [clientId, setClientId] = useState(role === "client_primary" || role === "client_secondary" ? (currentUser?.clientId ?? "") : (clients[0]?.id ?? ""));
  const [scopeType, setScopeType] = useState<"consolidated" | "policy">("consolidated");
  const [policyId, setPolicyId] = useState("");
  const [periodStart, setPeriodStart] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [generated, setGenerated] = useState(false);

  if (!currentUser) return null;

  const policiesForClient = state.policies.filter((p) => p.clientId === clientId);

  return (
    <div>
      <PageBreadcrumb pageTitle="Reports" />
      <div className="max-w-xl">
        <ComponentCard title="Generate Report" desc="Reproduces the client's existing report templates.">
          <div className="space-y-5">
            <div>
              <Label>Report Type</Label>
              <Select
                options={[
                  { value: "claims_history", label: "Claims History" },
                  { value: "performance", label: "Performance" },
                ]}
                defaultValue={type}
                onChange={(v) => setType(v as ReportType)}
              />
            </div>
            {clients.length > 1 && (
              <div>
                <Label>Client</Label>
                <Select
                  options={clients.map((c) => ({ value: c.id, label: c.name }))}
                  defaultValue={clientId}
                  onChange={(v) => {
                    setClientId(v);
                    setPolicyId("");
                  }}
                />
              </div>
            )}
            <div>
              <Label>Scope</Label>
              <Select
                options={[
                  { value: "consolidated", label: "Consolidated — all policies" },
                  { value: "policy", label: "Single policy" },
                ]}
                defaultValue={scopeType}
                onChange={(v) => setScopeType(v as "consolidated" | "policy")}
              />
            </div>
            {scopeType === "policy" && (
              <div>
                <Label>Policy</Label>
                <Select
                  key={clientId}
                  options={policiesForClient.map((p) => ({ value: p.id, label: p.policyNumber }))}
                  placeholder="Select a policy"
                  onChange={setPolicyId}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Period Start</Label>
                <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700" />
              </div>
              <div>
                <Label>Period End</Label>
                <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700" />
              </div>
            </div>
            <Button
              size="sm"
              disabled={!clientId || (scopeType === "policy" && !policyId)}
              onClick={() => {
                addReport({
                  type,
                  clientId,
                  scope: scopeType === "policy" ? { policyId } : "consolidated",
                  periodStart: new Date(periodStart).toISOString(),
                  periodEnd: new Date(periodEnd).toISOString(),
                  generatedById: currentUser.id,
                });
                setGenerated(true);
              }}
            >
              Generate
            </Button>
            {generated && (
              <p className="text-theme-sm text-success-600 dark:text-success-400">
                Report generated and stored. See{" "}
                <Link href="/reports/history" className="font-medium underline">
                  Report History
                </Link>
                .
              </p>
            )}
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
