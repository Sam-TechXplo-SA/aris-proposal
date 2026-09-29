"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/utils";
import { CLIENT_NAV_ITEMS, isClientNavActive } from "./clientNav";

// Mobile primary nav for the User/Client Portal, per §10.2/§20.2 ("bottom nav, primary
// on mobile"). Hidden at lg+ where ClientSidebar carries the full nav.
export default function ClientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-gray-800 dark:bg-gray-900">
      {CLIENT_NAV_ITEMS.filter((i) => i.primary).map(({ href, label, icon: Icon }) => {
        const isActive = isClientNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-theme-xs font-medium",
              isActive ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
