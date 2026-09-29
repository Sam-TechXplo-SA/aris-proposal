"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { findClient } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";

export default function ClientProfilePage() {
  const { currentUser } = useAuth();
  const { state } = useData();
  if (!currentUser) return null;
  const client = findClient(state, currentUser.clientId);

  return (
    <div className="space-y-6">
      <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">Profile</h1>
      <ComponentCard title="Account">
        <dl className="space-y-3">
          <div>
            <dt className="text-theme-xs text-gray-400">Name</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{currentUser.name}</dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Email</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{currentUser.email}</dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Organisation</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{client?.name}</dd>
          </div>
          <div>
            <dt className="text-theme-xs text-gray-400">Contact Type</dt>
            <dd className="text-theme-sm text-gray-700 dark:text-gray-300">{currentUser.role === "client_primary" ? "Primary" : "Secondary"}</dd>
          </div>
        </dl>
      </ComponentCard>
      <ComponentCard title="Security">
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">Multi-factor authentication is required on every login.</p>
        <Link href="/mfa-enrol" className="mt-2 inline-block text-theme-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Re-enrol a device
        </Link>
      </ComponentCard>
    </div>
  );
}
