import MfaEnrolForm from "@/components/auth/MfaEnrolForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up MFA | Aris Claims System",
  description: "Multi-factor authentication enrolment for the Aris Claims System prototype",
};

export default function MfaEnrolPage() {
  return <MfaEnrolForm />;
}
