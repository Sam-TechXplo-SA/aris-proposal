"use client";

import ComponentCard from "@/components/common/ComponentCard";
import MessageThread from "@/components/claims/MessageThread";
import { useAuth } from "@/context/AuthContext";
import { commentsFor } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";

export default function ClientClaimCommentPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, addComment } = useData();
  const { currentUser } = useAuth();
  if (!claim || !currentUser) return null;

  return (
    <ComponentCard title="Comment" desc="A note on this claim's record — stays open even after the claim is closed.">
      <MessageThread
        claimId={claim.id}
        entries={commentsFor(state, claim.id)}
        placeholder="Add a comment…"
        emptyMessage="No comments yet."
        onSubmit={(body) => addComment({ claimId: claim.id, authorId: currentUser.id, authorRole: currentUser.role, body })}
      />
    </ComponentCard>
  );
}
