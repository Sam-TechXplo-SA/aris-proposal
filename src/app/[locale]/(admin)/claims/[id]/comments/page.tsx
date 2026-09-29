"use client";

import ComponentCard from "@/components/common/ComponentCard";
import MessageThread from "@/components/claims/MessageThread";
import { useAuth } from "@/context/AuthContext";
import { commentsFor } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";

// ux-blueprint.md §5.1/business rule #21 — a single reportable field, distinct from
// the Communication thread. Stays live even after the claim closes (e.g. subrogation
// or excess-refund updates).
export default function ClaimCommentsPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state, addComment } = useData();
  const { currentUser } = useAuth();
  if (!claim || !currentUser) return null;

  return (
    <div className="max-w-2xl">
      <ComponentCard title="Comments" desc="A reportable comment log — stays open even after closure, e.g. for subrogation or excess-refund updates.">
        <MessageThread
          claimId={claim.id}
          entries={commentsFor(state, claim.id)}
          placeholder="Add a comment…"
          emptyMessage="No comments on this claim yet."
          onSubmit={(body) => addComment({ claimId: claim.id, authorId: currentUser.id, authorRole: currentUser.role, body })}
        />
      </ComponentCard>
    </div>
  );
}
