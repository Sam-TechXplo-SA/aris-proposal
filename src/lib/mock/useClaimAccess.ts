"use client";

import { useAuth } from "@/context/AuthContext";
import { useData } from "@/lib/mock/store";
import type { Claim } from "@/lib/mock/types";

/**
 * Loads a claim by id and enforces record-level scoping (ux-blueprint.md §3.3/§3.5):
 * a Broker only ever sees their own assigned clients' claims, a Client only their own
 * org's — everything else should read as "not found," never "forbidden," so an
 * unauthorised user can't tell the record exists at all.
 */
export function useClaimAccess(claimId: string): { claim: Claim | null; notFound: boolean } {
  const { currentUser } = useAuth();
  const { state } = useData();

  const claim = state.claims.find((c) => c.id === claimId) ?? null;
  if (!claim || !currentUser) return { claim: null, notFound: true };

  const allowed =
    currentUser.role === "administrator" ||
    currentUser.role === "manager" ||
    (currentUser.role === "broker" && claim.brokerId === currentUser.id) ||
    ((currentUser.role === "client_primary" || currentUser.role === "client_secondary") && claim.clientId === currentUser.clientId);

  if (!allowed) return { claim: null, notFound: true };
  return { claim, notFound: false };
}
