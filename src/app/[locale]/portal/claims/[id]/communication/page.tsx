"use client";

import ComponentCard from "@/components/common/ComponentCard";
import MessageThread from "@/components/claims/MessageThread";
import { useAuth } from "@/context/AuthContext";
import { messagesFor } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";

export default function ClientClaimCommunicationPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, addMessage } = useData();
  const { currentUser } = useAuth();
  if (!claim || !currentUser) return null;

  return (
    <ComponentCard title="Communication" desc="Message your Broker about this claim — timestamped and retained.">
      <MessageThread
        claimId={claim.id}
        entries={messagesFor(state, claim.id)}
        placeholder="Message your Broker…"
        emptyMessage="No messages yet."
        onSubmit={(body) => addMessage({ claimId: claim.id, authorId: currentUser.id, authorRole: currentUser.role, body })}
      />
    </ComponentCard>
  );
}
