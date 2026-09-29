"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { homeForRole, useAuth } from "@/context/AuthContext";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";

// Mock MFA challenge — NFR-01 is mandatory for every role, on every login, across both
// apps. Any 6-digit code passes; this screen exists to make that step visible, not to
// secure anything.
export default function MfaChallengeForm() {
  const { currentUser, mfaVerified, completeMfa, ready } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) router.replace("/signin");
    else if (mfaVerified) router.replace(homeForRole(currentUser.role));
  }, [ready, currentUser, mfaVerified, router]);

  if (!ready || !currentUser) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    completeMfa();
    router.push(homeForRole(currentUser!.role));
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-1.5 text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white">
            Two-factor verification
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Signed in as <span className="font-medium text-gray-700 dark:text-gray-300">{currentUser.name}</span>.
            Enter any 6-digit code — this is a prototype, nothing is actually verified.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <Label>Authentication code</Label>
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                error={!!error}
              />
              {error && <p className="mt-1.5 text-sm text-error-500">{error}</p>}
            </div>
            <Button className="w-full" size="md">
              Verify &amp; continue
            </Button>
          </div>
        </form>
        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Setting up a new device?{" "}
          <Link href="/mfa-enrol" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
            Enrol in MFA
          </Link>
        </p>
      </div>
    </div>
  );
}
