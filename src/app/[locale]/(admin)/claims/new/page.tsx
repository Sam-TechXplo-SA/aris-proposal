"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useData, useOwnClients } from "@/lib/mock/store";
import { useEffect, useMemo, useState } from "react";

// Broker-assisted lodgement (UC-15) — ux-blueprint.md §14: a single scrollable
// sectioned page, not a wizard, because this user (Broker/Administrator) is frequent
// and trained — wizard step-friction has no benefit here (contrast with the Client's
// 5-step wizard at /portal/claims/new).
export default function AdminNewClaimPage() {
  const { currentUser } = useAuth();
  const { state, submitClaim, uploadDocument } = useData();
  const router = useRouter();
  const role = currentUser?.role ?? "broker";
  const clients = useOwnClients(role, currentUser?.id ?? "");

  const [clientId, setClientId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [claimType, setClaimType] = useState("");
  const [dateOfLoss, setDateOfLoss] = useState("");
  const [location, setLocation] = useState("");
  const [narrative, setNarrative] = useState("");
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [error, setError] = useState("");

  const policies = useMemo(() => state.policies.filter((p) => p.clientId === clientId), [state.policies, clientId]);
  const policy = policies.find((p) => p.id === policyId);
  const sections = policy?.sections ?? [];
  const section = sections.find((s) => s.id === sectionId);
  const assets = useMemo(() => (section ? state.assets.filter((a) => a.sectionId === section.id) : []), [state.assets, section]);

  useEffect(() => {
    if (section && !claimType) setClaimType(section.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  if (!currentUser) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    if (!clientId || !policyId || !sectionId || (section?.requiresAsset && !assetId) || !claimType || !dateOfLoss || !location || !narrative) {
      setError("Please complete every required field before submitting.");
      return;
    }
    const id = submitClaim({
      clientId,
      policyId,
      sectionId,
      assetId: assetId || undefined,
      claimType,
      dateOfLoss: new Date(dateOfLoss).toISOString(),
      location,
      narrative,
      lodgementChannel: "broker_assisted",
      lodgedById: currentUser.id,
      brokerId: role === "broker" ? currentUser.id : (clients.find((c) => c.id === clientId)?.brokerId ?? currentUser.id),
      actorRole: role,
    });
    photoNames.forEach((filename) =>
      uploadDocument({ claimId: id, docType: "photo", filename, uploadedById: currentUser.id, actorRole: role }),
    );
    router.push(`/claims/${id}/claim-form`);
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="New Claim" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <ComponentCard title="Client &amp; Policy" desc="Select who this claim is for and which cover applies.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>Client</Label>
              <Select
                options={clients.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select a client"
                onChange={(v) => {
                  setClientId(v);
                  setPolicyId("");
                  setSectionId("");
                  setAssetId("");
                }}
              />
            </div>
            <div>
              <Label>Policy</Label>
              <Select
                key={clientId}
                options={policies.map((p) => ({ value: p.id, label: p.policyNumber }))}
                placeholder={clientId ? "Select a policy" : "Select a client first"}
                onChange={(v) => {
                  setPolicyId(v);
                  setSectionId("");
                  setAssetId("");
                }}
              />
            </div>
            <div>
              <Label>Section</Label>
              <Select
                key={policyId}
                options={sections.map((s) => ({ value: s.id, label: `${s.name} — ${s.insurer}` }))}
                placeholder={policyId ? "Select a section" : "Select a policy first"}
                onChange={(v) => {
                  setSectionId(v);
                  setAssetId("");
                }}
              />
            </div>
            {section?.requiresAsset && (
              <div>
                <Label>
                  Asset <span className="text-error-500">*</span>
                </Label>
                <Select
                  key={sectionId}
                  options={assets.map((a) => ({ value: a.id, label: a.description }))}
                  placeholder="Select the affected asset"
                  onChange={setAssetId}
                />
              </div>
            )}
          </div>
        </ComponentCard>

        <ComponentCard title="Loss Details" desc="What happened, where, and when.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>
                Claim Type <span className="text-error-500">*</span>
              </Label>
              <Input placeholder="e.g. Motor Accident" value={claimType} onChange={(e) => setClaimType(e.target.value)} />
            </div>
            <div>
              <Label>
                Date of Loss <span className="text-error-500">*</span>
              </Label>
              <Input type="date" value={dateOfLoss} onChange={(e) => setDateOfLoss(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>
                Location <span className="text-error-500">*</span>
              </Label>
              <Input placeholder="Where did this happen?" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>
                Narrative <span className="text-error-500">*</span>
              </Label>
              <TextArea rows={4} placeholder="Describe what happened" value={narrative} onChange={setNarrative} />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Attachments" desc="Optional — photos or reports can also be added later from the Documents tab.">
          <div>
            <input
              type="file"
              multiple
              onChange={(e) => setPhotoNames(Array.from(e.target.files ?? []).map((f) => f.name))}
              className="block w-full text-theme-sm text-gray-600 file:me-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-theme-sm file:font-medium file:text-brand-600 dark:text-gray-300 dark:file:bg-brand-500/15 dark:file:text-brand-400"
            />
            {photoNames.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-theme-xs text-gray-500 dark:text-gray-400">
                {photoNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        </ComponentCard>

        {error && <p className="text-theme-sm text-error-500">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button size="sm">Continue to Claim Form</Button>
        </div>
      </form>
    </div>
  );
}
