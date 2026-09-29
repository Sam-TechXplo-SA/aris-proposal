"use client";

import StatusBadge from "@/components/claims/StatusBadge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { AlertIcon } from "@/icons";
import { findClient, findSection, findUser, formatDate } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import type { Claim } from "@/lib/mock/types";
import { cn } from "@/utils";

interface ClaimsTableProps {
  claims: Claim[];
  showClientColumn?: boolean;
  showBrokerColumn?: boolean;
  emptyMessage?: string;
  /** false when the table sits inside a card that already provides the frame. */
  framed?: boolean;
}

export default function ClaimsTable({
  claims,
  showClientColumn = true,
  showBrokerColumn = false,
  emptyMessage = "No claims match this view.",
  framed = true,
}: ClaimsTableProps) {
  const { state } = useData();

  if (claims.length === 0) {
    return (
      <div className={cn("p-10 text-center text-theme-sm text-gray-500 dark:text-gray-400", framed && "rounded-xl border border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900")}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", framed && "rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900")}>
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/2">
            <TableRow>
              <TableCell isHeader className="px-5 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Reference
              </TableCell>
              {showClientColumn && (
                <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Client
                </TableCell>
              )}
              <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Type &amp; Insurer
              </TableCell>
              {showBrokerColumn && (
                <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Broker
                </TableCell>
              )}
              <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Status
              </TableCell>
              <TableCell isHeader className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                Updated
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {claims.map((claim) => {
              const client = findClient(state, claim.clientId);
              const section = findSection(state, claim.sectionId);
              const broker = findUser(state, claim.brokerId);
              return (
                <TableRow key={claim.id} className="transition-colors hover:bg-gray-50/80 dark:hover:bg-white/2">
                  <TableCell className="px-5 py-3 text-start whitespace-nowrap">
                    <Link href={`/claims/${claim.id}`} className="group flex items-center gap-2">
                      <span className="text-theme-sm font-medium text-gray-900 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400">{claim.reference}</span>
                      {claim.lateReported && <AlertIcon className="size-4 text-warning-500" />}
                    </Link>
                  </TableCell>
                  {showClientColumn && (
                    <TableCell className="max-w-52 px-4 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                      <span className="block truncate">{client?.name ?? "—"}</span>
                    </TableCell>
                  )}
                  <TableCell className="min-w-40 px-4 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                    {claim.claimType}
                    <span className="block text-theme-xs text-gray-500 dark:text-gray-400">{section?.insurer}</span>
                  </TableCell>
                  {showBrokerColumn && (
                    <TableCell className="px-4 py-3 text-start text-theme-sm whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {broker?.name ?? "—"}
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3 text-start">
                    <StatusBadge status={claim.status} size="sm" />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-start text-theme-xs whitespace-nowrap text-gray-500 tabular-nums dark:text-gray-400">{formatDate(claim.updatedAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
