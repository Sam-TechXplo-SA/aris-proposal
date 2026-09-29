"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { findSection, formatCurrency } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ClaimFinancialsPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, updateFinancials } = useData();
  const { currentUser } = useAuth();
  const [gross, setGross] = useState(claim?.grossAmount?.toString() ?? "");

  if (!claim || !currentUser) return null;

  const section = findSection(state, claim.sectionId);
  const excess = section?.excess ?? 0;
  const grossAmount = claim.grossAmount ?? 0;
  const vatRate = state.companySettings.vatRate;
  const vatAmount = (grossAmount * vatRate) / 100;
  const netClaim = Math.max(0, grossAmount - excess);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ComponentCard title="Update Gross Claim Amount">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = Number(gross);
            if (Number.isFinite(value) && value >= 0) {
              updateFinancials({ claimId: claim.id, grossAmount: value, actorId: currentUser.id, actorRole: currentUser.role });
            }
          }}
          className="space-y-4"
        >
          <div>
            <Label>Gross Claim Amount (ZAR)</Label>
            <Input type="number" min={0} value={gross} onChange={(e) => setGross(e.target.value)} />
          </div>
          <Button size="sm">Save</Button>
        </form>
      </ComponentCard>

      <ComponentCard title="Summary">
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-theme-sm text-gray-500 dark:text-gray-400">Gross Claim Amount</dt>
            <dd className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{formatCurrency(grossAmount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-theme-sm text-gray-500 dark:text-gray-400">Policy Excess</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{formatCurrency(excess)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-theme-sm text-gray-500 dark:text-gray-400">VAT ({vatRate}%, informational)</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{formatCurrency(vatAmount)}</dd>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3 dark:border-white/5">
            <dt className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">Net Claim</dt>
            <dd className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{formatCurrency(netClaim)}</dd>
          </div>
        </dl>
      </ComponentCard>
    </div>
  );
}
