import type { ClaimField, ClaimFormSchema } from "@/data/claim-forms/types";
import type { ClientOrg, Policy, User } from "@/lib/mock/types";

/**
 * FR-16 pre-fill — heuristic, since each insurer names its own fields differently and
 * there's no cross-form canonical field-id map. Matches on id/label text; still fully
 * editable, just rendered in a visually distinct "system-filled" state (see
 * ClaimFormWizard) so the reviewer can see what came from the system versus what they
 * still need to enter.
 */
export function computePrefillValue(field: ClaimField, ctx: { client: ClientOrg; policy?: Policy; broker?: User }): string | undefined {
  if (field.type !== "text") return undefined;
  const hay = `${field.id} ${field.label}`.toLowerCase();
  if (/\bother\b/.test(hay)) return undefined; // never pre-fill an "other party"/"other vehicle" field

  if (/\binsured\b.*\bname\b|\bname\b.*\binsured\b/.test(hay)) return ctx.client.name;
  if (/\bpolicy\b.*\b(no|num|number)\b/.test(hay)) return ctx.policy?.policyNumber;
  if (/\bbroker\b|\bagent\b/.test(hay)) return ctx.broker?.name;
  if (/\baddress\b/.test(hay) && !/\bemail\b/.test(hay)) return ctx.client.address;
  return undefined;
}

export function computeAllPrefills(schema: ClaimFormSchema, ctx: { client: ClientOrg; policy?: Policy; broker?: User }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of schema.fields) {
    const value = computePrefillValue(field, ctx);
    if (value) out[field.id] = value;
  }
  return out;
}
