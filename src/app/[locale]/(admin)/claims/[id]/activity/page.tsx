"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { findUser, formatDateTime, auditFor } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";

export default function ClaimActivityPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state } = useData();
  if (!claim) return null;

  const entries = auditFor(state, { claimId: claim.id });

  return (
    <ComponentCard title="Activity" desc="Immutable, timestamped record of every material action on this claim.">
      <ol className="relative space-y-6 ps-6">
        <span className="absolute top-1 bottom-1 start-[7px] w-px bg-gray-200 dark:bg-gray-800" />
        {entries.map((entry) => {
          const actor = findUser(state, entry.actorId);
          return (
            <li key={entry.id} className="relative">
              <span className="absolute -start-6 top-1 size-3.5 rounded-full border-2 border-white bg-brand-500 dark:border-gray-900" />
              <p className="text-theme-sm text-gray-700 dark:text-gray-300">{entry.action}</p>
              <p className="text-theme-xs text-gray-400">
                {actor?.name ?? (entry.actorId === "system" ? "System" : entry.actorId)} · {formatDateTime(entry.createdAt)}
              </p>
            </li>
          );
        })}
      </ol>
    </ComponentCard>
  );
}
