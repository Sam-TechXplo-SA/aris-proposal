"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import Wordmark from "@/components/common/Wordmark";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { Link } from "@/i18n/navigation";
import { HorizontaLDots, SearchIcon, SidebarToggleIcon } from "@/icons";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const AppHeader: React.FC = () => {
  const t = useTranslations("header");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1280) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-99999 flex h-16 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-900/90">
      <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className={cn(
              "flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5",
              isMobileOpen && "bg-gray-100 dark:bg-white/5",
            )}
            onClick={handleToggle}
            aria-label={t("toggleSidebar")}
          >
            <SidebarToggleIcon className="size-5 rtl:-scale-x-100" />
          </button>

          <Link href="/" className="xl:hidden">
            <Wordmark />
          </Link>

          <span className="hidden h-5 w-px bg-gray-200 xl:block dark:bg-gray-800" aria-hidden />

          <form className="hidden xl:block" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t("searchPlaceholder")}
                className="h-9 w-80 rounded-lg border border-gray-200 bg-gray-50 ps-9 pe-12 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-800 dark:bg-white/3 dark:text-white/90 dark:placeholder:text-white/30"
              />
              <kbd className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                ⌘K
              </kbd>
            </div>
          </form>
        </div>

        <button
          onClick={toggleApplicationMenu}
          className="flex size-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 xl:hidden dark:text-gray-400 dark:hover:bg-white/5"
          aria-label="More"
        >
          <HorizontaLDots className="size-5" />
        </button>

        <div
          className={cn(
            "absolute inset-x-0 top-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-theme-md xl:static xl:flex xl:border-0 xl:bg-transparent xl:p-0 xl:shadow-none dark:border-gray-800 dark:bg-gray-900 xl:dark:bg-transparent",
            isApplicationMenuOpen ? "flex" : "hidden",
          )}
        >
          <div className="flex items-center gap-1">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <span className="hidden h-5 w-px bg-gray-200 xl:block dark:bg-gray-800" aria-hidden />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
