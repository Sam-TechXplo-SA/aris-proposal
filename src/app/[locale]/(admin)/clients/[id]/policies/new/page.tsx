"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { CLAIM_FORM_REGISTRY } from "@/data/claim-forms";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { useData } from "@/lib/mock/store";
import { useParams } from "next/navigation";
import { useState } from "react";

const INSURERS = [...new Set(CLAIM_FORM_REGISTRY.map((f) => f.insurer))].sort();

interface DraftSection {
  name: string;
  insurer: string;
  claimFormSlug: string;
  excess: string;
  requiresAsset: boolean;
}

function emptySection(): DraftSection {
  return { name: "", insurer: "", claimFormSlug: "", excess: "0", requiresAsset: false };
}

// UC-09 — Administrator/Broker maintain policy records. A policy with no sections
// can't be selected against a claim, so at least one section (mapped to an insurer
// claim form, per FR-15) is required before saving.
export default function NewPolicyPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { addPolicy } = useData();
  const router = useRouter();

  const [policyNumber, setPolicyNumber] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [sections, setSections] = useState<DraftSection[]>([emptySection()]);

  if (!currentUser) return null;

  const updateSection = (index: number, patch: Partial<DraftSection>) => {
    setSections((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const canSubmit =
    policyNumber.trim() &&
    periodStart &&
    periodEnd &&
    sections.length > 0 &&
    sections.every((s) => s.name.trim() && s.insurer && s.claimFormSlug);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !currentUser) return;
    addPolicy({
      policy: {
        clientId,
        policyNumber: policyNumber.trim(),
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
        sections: sections.map((s) => ({
          name: s.name.trim(),
          insurer: s.insurer,
          claimFormSlug: s.claimFormSlug,
          excess: Number(s.excess) || 0,
          requiresAsset: s.requiresAsset,
        })),
      },
      actorId: currentUser.id,
      actorRole: currentUser.role,
    });
    router.push(`/clients/${clientId}/policies`);
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="New Policy" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <ComponentCard title="Policy">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <Label>
                Policy Number <span className="text-error-500">*</span>
              </Label>
              <Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="e.g. AB-XYZ-0001" />
            </div>
            <div>
              <Label>
                Period Start <span className="text-error-500">*</span>
              </Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div>
              <Label>
                Period End <span className="text-error-500">*</span>
              </Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Sections" desc="Each section is what a claim gets lodged against — it determines the insurer claim form (FR-15).">
          <div className="space-y-4">
            {sections.map((section, index) => {
              const formsForInsurer = CLAIM_FORM_REGISTRY.filter((f) => f.insurer === section.insurer);
              return (
                <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Section {index + 1}</p>
                    {sections.length > 1 && (
                      <button type="button" onClick={() => setSections((list) => list.filter((_, i) => i !== index))} className="text-gray-400 hover:text-error-500">
                        <TrashBinIcon className="size-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label>
                        Section Name <span className="text-error-500">*</span>
                      </Label>
                      <Input value={section.name} onChange={(e) => updateSection(index, { name: e.target.value })} placeholder="e.g. Motor, Property" />
                    </div>
                    <div>
                      <Label>
                        Excess (ZAR) <span className="text-error-500">*</span>
                      </Label>
                      <Input type="number" min={0} value={section.excess} onChange={(e) => updateSection(index, { excess: e.target.value })} />
                    </div>
                    <div>
                      <Label>
                        Insurer / UMA <span className="text-error-500">*</span>
                      </Label>
                      <Select
                        options={INSURERS.map((i) => ({ value: i, label: i }))}
                        placeholder="Select insurer"
                        onChange={(v) => updateSection(index, { insurer: v, claimFormSlug: "" })}
                      />
                    </div>
                    <div>
                      <Label>
                        Claim Form <span className="text-error-500">*</span>
                      </Label>
                      <Select
                        key={section.insurer}
                        options={formsForInsurer.map((f) => ({ value: f.slug, label: f.title }))}
                        placeholder={section.insurer ? "Select claim form" : "Select an insurer first"}
                        onChange={(v) => updateSection(index, { claimFormSlug: v })}
                      />
                    </div>
                    <div className="flex items-end pb-1 sm:col-span-2">
                      <Checkbox label="Requires an asset to be selected at claim time" checked={section.requiresAsset} onChange={(checked) => updateSection(index, { requiresAsset: checked })} />
                    </div>
                  </div>
                </div>
              );
            })}
            <Button size="sm" variant="outline" startIcon={<PlusIcon className="size-4" />} onClick={() => setSections((list) => [...list, emptySection()])}>
              Add another section
            </Button>
          </div>
        </ComponentCard>

        <Button size="sm" disabled={!canSubmit}>
          Save Policy
        </Button>
      </form>
    </div>
  );
}
