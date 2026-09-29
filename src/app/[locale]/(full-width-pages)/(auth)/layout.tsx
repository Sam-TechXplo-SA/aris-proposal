import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import Wordmark from "@/components/common/Wordmark";
import { ThemeProvider } from "@/context/ThemeContext";
import { ShieldCheckIcon } from "@/icons";
import React from "react";

const HIGHLIGHTS = [
  "Lodge and track every claim from first notice to settlement",
  "Insurer claim forms, documents and checklists in one record",
  "Clients see live status without chasing their broker",
];

// Sign-in / MFA shell: the form on white, the Aris brand on a solid red panel.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="grid min-h-screen bg-white lg:grid-cols-2 dark:bg-gray-950">
        <div className="flex flex-col px-6 py-8 sm:px-10">
          <Wordmark />
          <div className="flex flex-1 py-10">{children}</div>
          <p className="text-theme-xs text-gray-400">© {new Date().getFullYear()} Aris Brokers (Pty) Ltd · Authorised financial services provider</p>
        </div>

        <div className="relative hidden overflow-hidden bg-brand-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
          {/* Soft light falloff and a faint diagonal texture — depth without decoration. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(255,255,255,0.18),transparent_60%)]" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 28px)" }}
          />

          <div className="relative">
            <Wordmark tone="inverted" />
          </div>

          <div className="relative max-w-md">
            <h2 className="text-title-md font-semibold tracking-tight text-white">Claims, handled end to end.</h2>
            <p className="mt-3 text-base text-white/80">One system for brokers and clients — from lodgement and documents to insurer decisions and settlement.</p>
            <ul className="mt-8 space-y-3">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-3 text-theme-sm text-white/90">
                  <ShieldCheckIcon className="mt-0.5 size-4.5 shrink-0 text-white" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative flex items-center gap-2 text-theme-xs text-white/70">
            <ShieldCheckIcon className="size-4" /> Protected with multi-factor authentication
          </p>
        </div>

        <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </ThemeProvider>
  );
}
