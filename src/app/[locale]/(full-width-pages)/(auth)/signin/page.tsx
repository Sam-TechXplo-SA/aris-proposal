import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Aris Claims System",
  description: "Sign in to the Aris Claims System prototype",
};

export default function SignIn() {
  return <SignInForm />;
}
