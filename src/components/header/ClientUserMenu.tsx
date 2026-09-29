"use client";

import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { homeForRole, useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "@/i18n/navigation";
import { findClient } from "@/lib/mock/helpers";
import { useData } from "@/lib/mock/store";
import type { Role } from "@/lib/mock/types";
import { useState } from "react";

const SWITCHER_ROLES: { role: Role; label: string }[] = [
  { role: "administrator", label: "Administrator" },
  { role: "manager", label: "Manager" },
  { role: "broker", label: "Broker" },
  { role: "client_primary", label: "Client Contact" },
];

export function initialsOf(name: string): string {
  return name
    .replace(/\(.*?\)|\b(SOC|Ltd|Pty|Group|Holdings)\b/gi, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const itemClass =
  "flex w-full rounded-lg px-3 py-2 text-start text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5";

// Avatar menu for the User Portal top bar — a lighter stand-in for the admin
// UserDropdown: profile, reports and sign-out, plus the prototype's role switcher.
export default function ClientUserMenu() {
  const router = useRouter();
  const { currentUser, switchTo, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const { state } = useData();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;
  const org = findClient(state, currentUser.clientId);
  const close = () => setIsOpen(false);

  const handleSwitchRole = (role: Role) => {
    const candidates = state.users.filter((u) =>
      role === "client_primary" ? u.role === "client_primary" || u.role === "client_secondary" : u.role === role,
    );
    const next = candidates.find((u) => u.id !== currentUser.id) ?? candidates[0];
    if (!next) return;
    switchTo(next.id);
    close();
    router.push(homeForRole(next.role));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={isOpen}
        className="dropdown-toggle flex size-9 items-center justify-center rounded-full bg-gray-900 text-theme-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-gray-900"
      >
        {initialsOf(currentUser.name)}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={close}
        className="absolute mt-2 flex w-68 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg ltr:right-0 rtl:left-0 dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="px-3 pb-3">
          <span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{currentUser.name}</span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{currentUser.email}</span>
          {org && (
            <span className="mt-1 block text-theme-xs text-gray-400 dark:text-gray-500">
              {org.name} · {currentUser.role === "client_primary" ? "Primary contact" : "Secondary contact"}
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-0.5 border-t border-gray-200 pt-2 pb-2 dark:border-gray-800">
          <li className="lg:hidden">
            <DropdownItem tag="a" href="/portal/profile" onItemClick={close} className={itemClass}>
              Profile
            </DropdownItem>
          </li>
          <li className="lg:hidden">
            <DropdownItem tag="a" href="/portal/reports" onItemClick={close} className={itemClass}>
              Reports
            </DropdownItem>
          </li>
          <li>
            <button type="button" onClick={toggleTheme} className={itemClass}>
              Toggle dark mode
            </button>
          </li>
        </ul>

        <div className="border-t border-gray-200 py-3 dark:border-gray-800">
          <span className="mb-2 block px-1 text-theme-xs font-medium text-gray-400 uppercase dark:text-gray-500">Switch role (prototype)</span>
          <div className="grid grid-cols-2 gap-1.5">
            {SWITCHER_ROLES.map(({ role, label }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleSwitchRole(role)}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-start text-theme-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            close();
            router.push("/signin");
          }}
          className="flex w-full items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
