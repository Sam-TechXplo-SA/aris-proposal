"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { findClient, formatDate, formatDateTime, reportScopeLabel } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import type { ReportType } from "@/lib/mock/types";
import { useState } from "react";

export default function ClientReportsPage() {
  const { currentUser } = useAuth();
  const { state, addReport } = useData();
  const [type, setType] = useState<ReportType>("claims_history");
  const [scopeType, setScopeType] = useState<"consolidated" | "policy">("consolidated");
  const [policyId, setPolicyId] = useState("");
  const [generated, setGenerated] = useState(false);
  if (!currentUser) return null;

  const client = findClient(state, currentUser.clientId);
  const reports = state.reports.filter((r) => r.clientId === currentUser.clientId);
  const policies = state.policies.filter((p) => p.clientId === currentUser.clientId);

  return (
    <div className="space-y-6">
      <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Reports</h1>
      <ComponentCard title="Generate Report" desc={`For ${client?.name}, current underwriting year.`}>
        <div className="space-y-4">
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
              <Select options={policies.map((p) => ({ value: p.id, label: p.policyNumber }))} placeholder="Select a policy" onChange={setPolicyId} />
            </div>
          )}
          <Button
            size="sm"
            disabled={scopeType === "policy" && !policyId}
            onClick={() => {
              if (!client) return;
              addReport({
                type,
                clientId: client.id,
                scope: scopeType === "policy" ? { policyId } : "consolidated",
                periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString(),
                periodEnd: new Date().toISOString(),
                generatedById: currentUser.id,
              });
              setGenerated(true);
            }}
          >
            Generate
          </Button>
          {generated && <p className="text-theme-sm text-success-600 dark:text-success-400">Report generated and stored below.</p>}
        </div>
      </ComponentCard>

      <ComponentCard title="Your Reports">
        {reports.length === 0 ? (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">No reports generated yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{r.type === "claims_history" ? "Claims History" : "Performance"}</p>
                  <p className="text-theme-xs text-gray-400">
                    {formatDate(r.periodStart)} — {formatDate(r.periodEnd)} · {reportScopeLabel(r.scope, state.policies)}
                  </p>
                </div>
                <p className="text-theme-xs text-gray-400">{formatDateTime(r.generatedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </ComponentCard>
    </div>
  );
}
