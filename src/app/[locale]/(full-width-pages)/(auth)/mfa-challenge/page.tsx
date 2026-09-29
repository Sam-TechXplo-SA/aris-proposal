import MfaChallengeForm from "@/components/auth/MfaChallengeForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Two-Factor Verification | Aris Claims System",
  description: "Two-factor verification for the Aris Claims System prototype",
};

export default function MfaChallengePage() {
  return <MfaChallengeForm />;
}
