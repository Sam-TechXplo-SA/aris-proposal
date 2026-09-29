"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  // Matches AppSidebar's widths (w-64 expanded, 72px collapsed); the sidebar only
  // docks from xl — below that it's an off-canvas drawer.
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "xl:ml-64"
    : "xl:ml-[72px]";

  return (
    <RequireAuth portal="admin">
      <div className="min-h-screen bg-gray-50 xl:flex dark:bg-gray-950">
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <main className="mx-auto max-w-(--breakpoint-2xl) px-4 py-6 md:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
