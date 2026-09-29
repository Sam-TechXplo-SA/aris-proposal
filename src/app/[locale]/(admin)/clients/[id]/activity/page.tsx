"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { auditFor, findUser, formatDateTime } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useParams } from "next/navigation";

export default function ClientActivityPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useData();
  const entries = auditFor(state, { clientId: id });

  return (
    <ComponentCard title="Activity">
      {entries.length === 0 ? (
        <p className="text-theme-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/5">
          {entries.map((entry) => {
            const actor = findUser(state, entry.actorId);
            return (
              <li key={entry.id} className="py-2.5">
                <p className="text-theme-sm text-gray-700 dark:text-gray-300">{entry.action}</p>
                <p className="text-theme-xs text-gray-400">
                  {actor?.name ?? (entry.actorId === "system" ? "System" : entry.actorId)} · {formatDateTime(entry.createdAt)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </ComponentCard>
  );
}
