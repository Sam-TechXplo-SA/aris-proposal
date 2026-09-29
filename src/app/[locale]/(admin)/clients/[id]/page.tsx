"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { findUser, formatDate } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useParams } from "next/navigation";

export default function ClientOrganisationPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useData();
  const client = state.clients.find((c) => c.id === id);
  if (!client) return null;

  const primary = findUser(state, client.primaryContactId);
  const secondary = findUser(state, client.secondaryContactId);
  const broker = findUser(state, client.brokerId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ComponentCard title="Organisation">
        <dl className="space-y-3">
          <div>
            <dt className="text-theme-xs text-gray-400">Registration Number</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{client.regNo ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Address</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{client.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Assigned Broker</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{broker?.name}</dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Client Since</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{formatDate(client.createdAt)}</dd>
          </div>
        </dl>
      </ComponentCard>

      <ComponentCard title="Contacts" desc="Up to 2 permitted contacts — identical system permissions (Q-009).">
        <div className="space-y-4">
          {primary && (
            <div>
              <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{primary.name} — Primary</p>
              <p className="text-theme-xs text-gray-400">{primary.email}</p>
            </div>
          )}
          {secondary ? (
            <div>
              <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{secondary.name} — Secondary</p>
              <p className="text-theme-xs text-gray-400">{secondary.email}</p>
            </div>
          ) : (
            <p className="text-theme-sm text-gray-400">No secondary contact on file.</p>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
