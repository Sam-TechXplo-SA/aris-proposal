"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { findClient, findUser, formatDateTime } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useState } from "react";

// ux-blueprint.md §5 task matrix: Administrator/Manager see everything; a Broker sees
// only their own actions. UC-14 — filterable by date range and action type.
export default function AuditTrailPage() {
  const { currentUser } = useAuth();
  const { state } = useData();
  const role = currentUser?.role ?? "broker";

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionQuery, setActionQuery] = useState("");

  const entries = [...state.auditEntries]
    .filter((e) => (role === "broker" ? e.actorId === currentUser?.id : true))
    .filter((e) => !dateFrom || e.createdAt >= new Date(dateFrom).toISOString())
    .filter((e) => !dateTo || e.createdAt <= new Date(new Date(dateTo).getTime() + 24 * 60 * 60 * 1000).toISOString())
    .filter((e) => !actionQuery.trim() || e.action.toLowerCase().includes(actionQuery.trim().toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 200);

  return (
    <div>
      <PageBreadcrumb pageTitle="Audit Trail" />
      <div className="mb-5 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3 dark:border-white/5 dark:bg-white/3">
        <div>
          <Label>From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <Label>To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div>
          <Label>Action contains</Label>
          <Input value={actionQuery} onChange={(e) => setActionQuery(e.target.value)} placeholder="e.g. decision, document, closed" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
        <Table>
          <TableHeader className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/2">
            <TableRow>
              <TableCell isHeader className="px-5 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Action</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Client</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Actor</TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">When</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.length === 0 && (
              <TableRow>
                <TableCell className="px-5 py-6 text-theme-sm text-gray-400">No activity matches these filters.</TableCell>
              </TableRow>
            )}
            {entries.map((entry) => {
              const actor = findUser(state, entry.actorId);
              const client = findClient(state, entry.clientId);
              return (
                <TableRow key={entry.id}>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-700 sm:px-6 dark:text-gray-300">{entry.action}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{client?.name ?? "—"}</TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    {actor?.name ?? (entry.actorId === "system" ? "System" : entry.actorId)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-xs text-gray-400">{formatDateTime(entry.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
