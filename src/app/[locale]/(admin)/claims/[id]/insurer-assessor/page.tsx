"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import StepProgress from "@/components/ui/step-progress/StepProgress";
import { useAuth } from "@/context/AuthContext";
import { statusLabel } from "@/lib/mock/status";
import { ASSESSMENT_SEQUENCE, useData } from "@/lib/mock/store";
import { useClaimAccess } from "@/lib/mock/useClaimAccess";
import { useParams } from "next/navigation";
import { useState } from "react";

const ASSESSMENT_STEPS = ASSESSMENT_SEQUENCE.map((status) => ({ key: status, label: statusLabel(status) }));

// ux-blueprint.md §5 task matrix: "Process/forward claim to insurer" — small field set,
// frequent touch, inline on the claim record. Status progression is gated on the
// insurer claim number being captured (FR-21).
export default function ClaimInsurerAssessorPage() {
  const { id } = useParams<{ id: string }>();
  const { claim } = useClaimAccess(id);
  const { processToInsurer, advanceAssessment } = useData();
  const { currentUser } = useAuth();

  const [insurerClaimNo, setInsurerClaimNo] = useState(claim?.insurerClaimNo ?? "");
  const [assessorName, setAssessorName] = useState(claim?.assessor?.name ?? "");
  const [assessorCompany, setAssessorCompany] = useState(claim?.assessor?.company ?? "");
  const [assessorContact, setAssessorContact] = useState(claim?.assessor?.contact ?? "");

  if (!claim || !currentUser) return null;

  const alreadyProcessed = !!claim.insurerClaimNo;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!insurerClaimNo.trim()) return;
    processToInsurer({
      claimId: claim!.id,
      insurerClaimNo: insurerClaimNo.trim(),
      assessor: assessorName || assessorCompany || assessorContact ? { name: assessorName, company: assessorCompany, contact: assessorContact } : undefined,
      actorId: currentUser!.id,
      actorRole: currentUser!.role,
    });
  }

  return (
    <div className="max-w-xl">
      <ComponentCard
        title="Insurer &amp; Assessor"
        desc={alreadyProcessed ? "This claim has been forwarded to the insurer." : "Capture the insurer's claim number once you've forwarded this claim by email."}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <Label>
              Insurer Claim Number <span className="text-error-500">*</span>
            </Label>
            <Input value={insurerClaimNo} onChange={(e) => setInsurerClaimNo(e.target.value)} placeholder="e.g. OM-MT-55219" />
            {!alreadyProcessed && (
              <p className="mt-1.5 text-theme-xs text-gray-400">Required to progress this claim past &ldquo;Submitted.&rdquo;</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Assessor Name</Label>
              <Input value={assessorName} onChange={(e) => setAssessorName(e.target.value)} />
            </div>
            <div>
              <Label>Assessor Company</Label>
              <Input value={assessorCompany} onChange={(e) => setAssessorCompany(e.target.value)} />
            </div>
            <div>
              <Label>Contact</Label>
              <Input value={assessorContact} onChange={(e) => setAssessorContact(e.target.value)} />
            </div>
          </div>
          <Button size="sm">{alreadyProcessed ? "Update" : "Forward to Insurer"}</Button>
        </form>
      </ComponentCard>

      {(() => {
        const stepIndex = ASSESSMENT_SEQUENCE.indexOf(claim.status);
        if (stepIndex === -1) return null;
        const next = ASSESSMENT_SEQUENCE[stepIndex + 1];
        return (
          <ComponentCard title="Assessment Progress" className="mt-6" desc="Milestones between forwarding to the insurer and their decision.">
            <StepProgress steps={ASSESSMENT_STEPS} currentIndex={stepIndex} className="mb-5" />
            {next && (
              <Button
                size="sm"
                onClick={() => advanceAssessment({ claimId: claim.id, actorId: currentUser.id, actorRole: currentUser.role })}
              >
                Mark as {statusLabel(next)}
              </Button>
            )}
          </ComponentCard>
        );
      })()}
    </div>
  );
}
