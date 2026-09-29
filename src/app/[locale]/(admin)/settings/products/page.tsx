"use client";

import AdministratorOnly from "@/components/auth/AdministratorOnly";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { CLAIM_FORM_REGISTRY } from "@/data/claim-forms";

// Administrator-only (FR-07): which insurer claim form is configured against which
// Insurer/UMA + claim type. This prototype ships all 17 ClaimFormFiller forms
// pre-registered; a real build would let an Administrator add/replace forms here.
export default function ProductConfigPage() {
  return (
    <AdministratorOnly>
      <PageBreadcrumb pageTitle="Product & Document Configuration" />
      <ComponentCard title="Configured Claim Forms" desc="Every claim's insurer form is determined automatically from its policy section's Insurer/UMA (FR-15) — there is no manual form picker.">
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <Table>
            <TableHeader className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/2">
              <TableRow>
                <TableCell isHeader className="px-5 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Insurer</TableCell>
                <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Form</TableCell>
                <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Slug</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {CLAIM_FORM_REGISTRY.map((f) => (
                <TableRow key={f.slug}>
                  <TableCell className="px-5 py-3 text-theme-sm font-medium text-gray-700 sm:px-6 dark:text-gray-300">{f.insurer}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    {f.title}
                    {f.description && <span className="block text-theme-xs text-gray-400">{f.description}</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-xs text-gray-400">{f.slug}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </AdministratorOnly>
  );
}
