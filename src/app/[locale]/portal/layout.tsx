"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import ClientBottomNav from "@/layout/ClientBottomNav";
import ClientSidebar from "@/layout/ClientSidebar";
import ClientTopNav from "@/layout/ClientTopNav";
import React from "react";

// User/Client Portal shell: dark grey side panel from lg (matching the Admin Portal),
// a slim header, and a bottom nav below lg. Lives at a real "/portal" path segment
// (not a route group) because the Admin Portal already owns "/".
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth portal="client">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <ClientSidebar />
        <div className="min-w-0 lg:ps-64 rtl:lg:ps-0 rtl:lg:pe-64">
          <ClientTopNav />
          <main className="mx-auto w-full max-w-(--breakpoint-2xl) px-4 pt-6 pb-24 md:px-6 lg:px-8 lg:pt-8 lg:pb-10">{children}</main>
        </div>
        <ClientBottomNav />
      </div>
    </RequireAuth>
  );
}
