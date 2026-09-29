"use client";

import ClaimsTable from "@/components/claims/ClaimsTable";
import { sortClaimsByAttention } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { useParams } from "next/navigation";

export default function ClientClaimsPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useData();
  const claims = sortClaimsByAttention(state.claims.filter((c) => c.clientId === id));

  return <ClaimsTable claims={claims} showClientColumn={false} showBrokerColumn emptyMessage="This client has no claims yet." />;
}
