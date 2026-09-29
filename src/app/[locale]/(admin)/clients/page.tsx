"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { PlusIcon } from "@/icons";
import { findUser } from "@/lib/mock/helpers";
import { canEditClient, useData, useScopedClients } from "@/lib/mock/store";

export default function ClientsListPage() {
  const { currentUser } = useAuth();
  const { state } = useData();
  const role = currentUser?.role ?? "broker";
  const clients = useScopedClients(role, currentUser?.id ?? "");

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Clients & Policies"
        description="Every client is visible here — you can only edit the ones assigned to you."
        actions={
          <>
            {(role === "administrator" || role === "manager") && (
              <Link href="/clients/new">
                <Button size="sm" startIcon={<PlusIcon className="size-4" />}>
                  New Client
                </Button>
              </Link>
            )}
          </>
        }
      />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900">
        <Table>
          <TableHeader className="border-b border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/2">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
              >
                Client
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
              >
                Broker
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
              >
                Policies
              </TableCell>
              <TableCell
                isHeader
                className="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
              >
                Access
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {clients.map((client) => {
              const broker = findUser(state, client.brokerId);
              const policyCount = state.policies.filter(
                (p) => p.clientId === client.id,
              ).length;
              const editable = canEditClient(
                role,
                currentUser?.id ?? "",
                client,
              );
              return (
                <TableRow
                  key={client.id}
                  className="transition-colors hover:bg-gray-50/80 dark:hover:bg-white/2"
                >
                  <TableCell className="px-5 py-3 sm:px-6">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-theme-sm font-medium text-gray-900 hover:text-brand-600 dark:text-white/90 dark:hover:text-brand-400"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    {broker?.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    {policyCount}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-theme-xs">
                    {editable ? (
                      <span className="text-success-600 dark:text-success-400">
                        Editable
                      </span>
                    ) : (
                      <span className="text-gray-400">View only</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
