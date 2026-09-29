"use client";

import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/mock/store";
import type { Role, User } from "@/lib/mock/types";

const STORAGE_KEY = "aris-claims-mock-auth-v1";
const MFA_STORAGE_KEY = "aris-claims-mock-mfa-v1";

// Prototype-only auth: no real credential check, no server session. §2.6 of the
// blueprint requires MFA to be mandatory and identical across both apps — the mock
// Login → MFA Enrolment/Challenge flow exists to make that visible, not to secure
// anything. "Home" per role per ux-blueprint.md §3.1: internal roles never see the
// Client Portal and vice versa.
export function homeForRole(role: Role): string {
  return role === "client_primary" || role === "client_secondary" ? "/portal" : "/";
}

export function isInternalRole(role: Role): boolean {
  return role === "administrator" || role === "manager" || role === "broker";
}

interface AuthContextValue {
  currentUser: User | null;
  mfaVerified: boolean;
  ready: boolean;
  /** Confirms identity (mock) and requires an MFA challenge before portal access, per NFR-01. */
  login: (userId: string) => void;
  completeMfa: () => void;
  logout: () => void;
  /** Dev role-switcher — hops role without re-authenticating (MFA already satisfied). */
  switchTo: (userId: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useData();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCurrentUserId(saved);
      setMfaVerified(localStorage.getItem(MFA_STORAGE_KEY) === "1");
    } catch {
      // storage unavailable — prototype just starts logged out
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (currentUserId) localStorage.setItem(STORAGE_KEY, currentUserId);
      else localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(MFA_STORAGE_KEY, mfaVerified ? "1" : "0");
    } catch {
      // ignore
    }
  }, [currentUserId, mfaVerified, ready]);

  const currentUser = useMemo(
    () => (currentUserId ? (state.users.find((u) => u.id === currentUserId) ?? null) : null),
    [currentUserId, state.users],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      mfaVerified,
      ready,
      login: (userId) => {
        setCurrentUserId(userId);
        setMfaVerified(false);
      },
      completeMfa: () => setMfaVerified(true),
      logout: () => {
        setCurrentUserId(null);
        setMfaVerified(false);
      },
      switchTo: (userId) => setCurrentUserId(userId),
    }),
    [currentUser, mfaVerified, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
