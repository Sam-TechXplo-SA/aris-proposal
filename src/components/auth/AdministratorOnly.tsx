"use client";

import NotFoundPanel from "@/components/common/NotFoundPanel";
import { useAuth } from "@/context/AuthContext";

/**
 * Guards whole-module Administrator-only pages (Users & Access edit affordances live
 * inline; this is for pages with no legitimate partial view for other roles: Product &
 * Document Configuration, Company & Report Settings). Per ux-blueprint.md §3.2/§3.5 —
 * a role reaching a URL hidden from their own nav should degrade gracefully, read as
 * "not found," not a dead component tree.
 */
export default function AdministratorOnly({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (currentUser && currentUser.role !== "administrator") {
    return <NotFoundPanel backHref="/" backLabel="Back to Dashboard" />;
  }
  return <>{children}</>;
}
