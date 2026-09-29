import { ChatIcon, DocsIcon, FolderIcon, ListIcon, PlusIcon, UserCircleIcon } from "@/icons";

type ClientNavItem = {
  href: string;
  label: string;
  icon: typeof ListIcon;
  group: "claims" | "support" | "account";
  /** Shown in the mobile bottom nav as well as the sidebar. */
  primary?: boolean;
};

// Shared by ClientSidebar (desktop) and ClientBottomNav (mobile, primary items only).
export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { href: "/portal", label: "My Claims", icon: ListIcon, group: "claims", primary: true },
  { href: "/portal/claims/new", label: "Lodge a Claim", icon: PlusIcon, group: "claims" },
  { href: "/portal/documents", label: "Documents", icon: FolderIcon, group: "claims", primary: true },
  { href: "/portal/contact", label: "Contact Broker", icon: ChatIcon, group: "support", primary: true },
  { href: "/portal/reports", label: "Reports", icon: DocsIcon, group: "support" },
  { href: "/portal/profile", label: "Profile", icon: UserCircleIcon, group: "account" },
];

export const CLIENT_NAV_GROUPS = [
  { id: "claims", label: "Claims" },
  { id: "support", label: "Support" },
  { id: "account", label: "Account" },
] as const;

// "My Claims" also owns the claim detail pages under /portal/claims (but not lodgement,
// which has its own item).
export function isClientNavActive(pathname: string, href: string): boolean {
  if (href === "/portal") return pathname === "/portal" || (pathname.startsWith("/portal/claims") && !pathname.startsWith("/portal/claims/new"));
  return pathname.startsWith(href);
}
