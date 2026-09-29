"use client";

import ComponentCard from "@/components/common/ComponentCard";
import MessageThread from "@/components/claims/MessageThread";
import { useAuth } from "@/context/AuthContext";
import { messagesFor } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";

// ux-blueprint.md §6.8/§5.1 — the conversational thread, distinct from the single
// reportable "Comments" field (see the Comments tab). Timestamped and retained.
export default function ClaimCommunicationPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, addMessage } = useData();
  const { currentUser } = useAuth();
  if (!claim || !currentUser) return null;

  return (
    <div className="max-w-2xl">
      <ComponentCard title="Communication" desc="A timestamped conversation with the client, distinct from the Comments field.">
        <MessageThread
          claimId={claim.id}
          entries={messagesFor(state, claim.id)}
          placeholder="Message the client…"
          emptyMessage="No messages on this claim yet."
          onSubmit={(body) => addMessage({ claimId: claim.id, authorId: currentUser.id, authorRole: currentUser.role, body })}
        />
      </ComponentCard>
    </div>
  );
}
