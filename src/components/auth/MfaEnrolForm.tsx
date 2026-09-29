"use client";

import Button from "@/components/ui/button/Button";
import { homeForRole, useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

// Mock MFA enrolment — triggered per UC-10 whenever a new user is invited. Shown here
// as a standalone reachable screen (Critical tier, §23.3) rather than gated behind a
// real invitation flow, since there's no backend to send one.
export default function MfaEnrolForm() {
  const { currentUser, completeMfa, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !currentUser) router.replace("/signin");
  }, [ready, currentUser, router]);

  if (!ready || !currentUser) return null;

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-1.5 text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white">
            Set up multi-factor authentication
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            MFA is required for every account (NFR-01). Scan this code with an
            authenticator app, then confirm below.
          </p>
        </div>
        <div className="mb-6 flex h-40 w-40 items-center justify-center self-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 dark:border-gray-700">
          QR code placeholder
        </div>
        <Button
          className="w-full"
          size="sm"
          onClick={() => {
            completeMfa();
            router.push(homeForRole(currentUser.role));
          }}
        >
          I&apos;ve added this account
        </Button>
      </div>
    </div>
  );
}
