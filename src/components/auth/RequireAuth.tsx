"use client";

import { homeForRole, isInternalRole, useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

/**
 * Client-side-only route guard (no real backend, so no middleware session check).
 * Enforces ux-blueprint.md §3.1: "both apps never render for the wrong role" and
 * §2.6: MFA is mandatory before either portal is reachable.
 */
export default function RequireAuth({
  portal,
  children,
}: {
  portal: "admin" | "client";
  children: React.ReactNode;
}) {
  const { currentUser, mfaVerified, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      router.replace("/signin");
      return;
    }
    if (!mfaVerified) {
      router.replace("/mfa-challenge");
      return;
    }
    const belongsHere = portal === "admin" ? isInternalRole(currentUser.role) : !isInternalRole(currentUser.role);
    if (!belongsHere) {
      router.replace(homeForRole(currentUser.role));
    }
  }, [ready, currentUser, mfaVerified, portal, router]);

  if (!ready || !currentUser || !mfaVerified) return null;
  const belongsHere = portal === "admin" ? isInternalRole(currentUser.role) : !isInternalRole(currentUser.role);
  if (!belongsHere) return null;

  return <>{children}</>;
}
