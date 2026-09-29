"use client";

import { initialsOf } from "@/components/header/ClientUserMenu";
import { useAuth } from "@/context/AuthContext";
import { Link, usePathname } from "@/i18n/navigation";
import { MailIcon } from "@/icons";
import { findClient, findUser } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import { cn } from "@/utils";
import { CLIENT_NAV_GROUPS, CLIENT_NAV_ITEMS, isClientNavActive } from "./clientNav";

// Dark grey side panel for the User/Client Portal — same surface and menu styling as
// the Admin Portal's AppSidebar, but led by the client org's own identity and closing
// with their assigned broker, so help is always one click away. Docked from lg; below
// that, ClientTopNav + ClientBottomNav carry navigation.
export default function ClientSidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { state } = useData();
  const org = findClient(state, currentUser?.clientId);
  const broker = findUser(state, org?.brokerId);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-side-panel-border bg-side-panel px-3 text-gray-100 lg:flex rtl:right-0 rtl:left-auto rtl:border-r-0 rtl:border-l">
      <Link href="/portal" className="flex min-h-16 shrink-0 items-center gap-2.5 px-2.5 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-[12px] font-bold tracking-wide text-white">
          {org ? initialsOf(org.name) : "—"}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="line-clamp-2 block text-theme-sm leading-snug font-semibold text-white">{org?.name ?? "Claims portal"}</span>
          <span className="block truncate text-[11px] text-gray-400">Claims portal</span>
        </span>
      </Link>

      <nav className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto pt-3" aria-label="Primary">
        {CLIENT_NAV_GROUPS.map((group) => (
          <div key={group.id}>
            <h2 className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{group.label}</h2>
            <ul className="flex flex-col gap-0.5">
              {CLIENT_NAV_ITEMS.filter((i) => i.group === group.id).map(({ href, label, icon: Icon }) => {
                const active = isClientNavActive(pathname, href);
                return (
                  <li key={href}>
                    <Link href={href} aria-current={active ? "page" : undefined} className={cn("group menu-item", active ? "menu-item-active" : "menu-item-inactive")}>
                      <Icon className={cn("size-5", active ? "menu-item-icon-active" : "menu-item-icon-inactive")} />
                      <span className="menu-item-text">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {broker && (
        <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Your broker</p>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-theme-xs font-semibold text-white">{initialsOf(broker.name)}</span>
            <span className="min-w-0">
              <span className="block truncate text-theme-sm font-medium text-white">{broker.name}</span>
              <a href={`mailto:${broker.email}`} className="flex items-center gap-1 truncate text-theme-xs text-gray-400 hover:text-white">
                <MailIcon className="size-3.5 shrink-0" /> <span className="truncate">{broker.email}</span>
              </a>
            </span>
          </div>
        </div>
      )}
      <p className="mb-4 flex items-center gap-2 px-2.5 text-[11px] text-gray-500">
        <span className="size-2 rounded-[3px] bg-brand-500" aria-hidden />
        Powered by <span className="font-medium text-gray-300">{state.companySettings.companyName.replace(/\s*\(Pty\)\s*Ltd\.?$/i, "")}</span>
      </p>
    </aside>
  );
}
