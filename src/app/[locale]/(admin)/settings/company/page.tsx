"use client";

import AdministratorOnly from "@/components/auth/AdministratorOnly";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import StatusBadge from "@/components/claims/StatusBadge";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { useData } from "@/lib/mock/store";
import { ALL_STATUSES } from "@/lib/mock/status";
import { CLIENT_STAGES, CLIENT_STAGE_SOURCE, DEFAULT_CLIENT_STAGE_LABELS } from "@/lib/mock/clientStatus";
import { useState } from "react";

export default function CompanySettingsPage() {
  const { state, updateCompanySettings } = useData();
  const [form, setForm] = useState(state.companySettings);
  const [stageLabels, setStageLabels] = useState({ ...DEFAULT_CLIENT_STAGE_LABELS, ...state.companySettings.clientStageLabels });

  return (
    <AdministratorOnly>
      <PageBreadcrumb pageTitle="Company & Report Settings" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title="Company Details" desc="Feeds every generated report's branding and disclaimer.">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              updateCompanySettings(form);
            }}
          >
            <div>
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div>
              <Label>FSP Licence</Label>
              <Input value={form.fspLicence} onChange={(e) => setForm({ ...form, fspLicence: e.target.value })} />
            </div>
            <div>
              <Label>Disclaimer Text</Label>
              <TextArea rows={3} value={form.disclaimerText} onChange={(v) => setForm({ ...form, disclaimerText: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>VAT Rate (%)</Label>
                <Input type="number" value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Default Reminder Interval (days)</Label>
                <Input type="number" value={form.defaultReminderIntervalDays} onChange={(e) => setForm({ ...form, defaultReminderIntervalDays: Number(e.target.value) })} />
              </div>
            </div>
            <Button size="sm">Save</Button>
          </form>
        </ComponentCard>

        <ComponentCard title="Claim Status → Colour Legend" desc="Single source of truth for status badges everywhere (§22.5) and the Reports legend.">
          <Alert
            variant="warning"
            title="Status wording is provisional (Q-003)"
            message="The blueprint's own 16-stage client-facing status list is flagged as a proposal, not final — this prototype synthesises a working list from the states named elsewhere in the document."
          />
          <ul className="mt-4 space-y-2">
            {ALL_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between">
                <StatusBadge status={s} size="sm" />
              </li>
            ))}
          </ul>
        </ComponentCard>

        <ComponentCard title="Client-Facing Status Labels" desc="The wording clients see in the User Portal. Each label covers one group of internal statuses.">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateCompanySettings({ clientStageLabels: stageLabels });
            }}
          >
            {CLIENT_STAGES.map((stage) => (
              <div key={stage}>
                <Label>Internal state: {CLIENT_STAGE_SOURCE[stage]}</Label>
                <Input
                  value={stageLabels[stage]}
                  placeholder={DEFAULT_CLIENT_STAGE_LABELS[stage]}
                  onChange={(e) => setStageLabels({ ...stageLabels, [stage]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex gap-3">
              <Button size="sm">Save labels</Button>
              <button
                type="button"
                onClick={() => setStageLabels(DEFAULT_CLIENT_STAGE_LABELS)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3"
              >
                Reset to defaults
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </AdministratorOnly>
  );
}
