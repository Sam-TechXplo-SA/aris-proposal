"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useData } from "@/lib/mock/store";
import { useParams } from "next/navigation";
import { useState } from "react";

// UC-09 — asset registration. Only an item on the asset register is covered
// (business rule #2), so this is what makes a section's "select the affected asset"
// step at claim time actually have options.
export default function NewAssetPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { state, addAsset } = useData();
  const router = useRouter();

  const sections = state.policies.filter((p) => p.clientId === clientId).flatMap((p) => p.sections.filter((s) => s.requiresAsset).map((s) => ({ ...s, policyNumber: p.policyNumber })));

  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [description, setDescription] = useState("");

  if (!currentUser) return null;

  if (sections.length === 0) {
    return (
      <div>
        <PageBreadcrumb pageTitle="New Asset" />
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">
          None of this client&apos;s policy sections require an asset register yet — add a section that does from Policies first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="New Asset" />
      <form
        className="max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sectionId || !description.trim()) return;
          addAsset({ asset: { sectionId, description: description.trim() }, actorId: currentUser.id, actorRole: currentUser.role });
          router.push(`/clients/${clientId}/policies`);
        }}
      >
        <ComponentCard title="Asset">
          <div className="space-y-5">
            <div>
              <Label>
                Section <span className="text-error-500">*</span>
              </Label>
              <Select
                options={sections.map((s) => ({ value: s.id, label: `${s.policyNumber} — ${s.name} (${s.insurer})` }))}
                defaultValue={sectionId}
                onChange={setSectionId}
              />
            </div>
            <div>
              <Label>
                Description <span className="text-error-500">*</span>
              </Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Toyota Hilux 2.8GD-6 — CA 123-456" />
            </div>
            <Button size="sm" disabled={!sectionId || !description.trim()}>
              Register Asset
            </Button>
          </div>
        </ComponentCard>
      </form>
    </div>
  );
}
