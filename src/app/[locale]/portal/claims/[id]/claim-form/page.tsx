"use client";

import ClaimFormWizard from "@/components/claims/ClaimFormWizard";
import { findSection } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";

export default function ClientClaimFormPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { state } = useData();
  if (!claim) return null;

  const section = findSection(state, claim.sectionId);
  if (!section) return null;

  return <ClaimFormWizard slug={section.claimFormSlug} claim={claim} portal="client" />;
}
