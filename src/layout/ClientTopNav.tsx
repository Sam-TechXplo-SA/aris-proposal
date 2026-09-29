"use client";

import ClientUserMenu, { initialsOf } from "@/components/header/ClientUserMenu";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronRightIcon, PlusIcon } from "@/icons";
import { findClient } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { CLIENT_NAV_ITEMS, isClientNavActive } from "./clientNav";

// Header bar for the User/Client Portal. From lg the dark ClientSidebar carries the
// org identity and nav, so this shows where you are plus the primary action; below lg
// it shows the org identity itself (nav moves to ClientBottomNav).
export default function ClientTopNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { state } = useData();
  const org = findClient(state, currentUser?.clientId);
  const brokerName = state.companySettings.companyName.replace(/\s*\(Pty\)\s*Ltd\.?$/i, "");
  const section = CLIENT_NAV_ITEMS.find((i) => isClientNavActive(pathname, i.href))?.label ?? "My Claims";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-900/90">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <Link href="/portal" className="flex min-w-0 items-center gap-3 lg:hidden">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-theme-xs font-bold tracking-wide text-white shadow-theme-xs">
            {org ? initialsOf(org.name) : "—"}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-theme-sm font-semibold text-gray-900 dark:text-white">{org?.name ?? "Claims portal"}</span>
            <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">Claims portal · powered by {brokerName}</span>
          </span>
        </Link>

        <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-theme-sm lg:flex">
          <span className="text-gray-500 dark:text-gray-400">Claims portal</span>
          <ChevronRightIcon className="size-3.5 text-gray-300 rtl:rotate-180 dark:text-gray-600" />
          <span className="font-medium text-gray-900 dark:text-white">{section}</span>
        </nav>

        <div className="flex items-center gap-3">
          {!pathname.startsWith("/portal/claims/new") && (
            <Link href="/portal/claims/new" className="hidden sm:block">
              <Button size="sm" startIcon={<PlusIcon className="size-4" />}>
                Lodge a Claim
              </Button>
            </Link>
          )}
          <span className="hidden h-5 w-px bg-gray-200 sm:block dark:bg-gray-800" aria-hidden />
          <ClientUserMenu />
        </div>
      </div>
    </header>
  );
}
