"use client";

import Wordmark from "@/components/common/Wordmark";
import { useAuth } from "@/context/AuthContext";
import { Link, usePathname } from "@/i18n/navigation";
import type { Role } from "@/lib/mock/types";
import { cn } from "@/utils";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
  DocsIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  ListIcon,
  PlugInIcon,
  TimeIcon,
  UserIcon,
} from "../icons/index";
type NavItem = {
  key: string;
  group?: "workspace" | "insights" | "admin";
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  target?: string;
  subItems?: {
    key: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    target?: string;
  }[];
};

// Role-based Admin Portal nav, per ux-blueprint.md §7.3/§7.4/§3.1: Company & Report
// Settings and Users & Access never render for a Broker (not greyed out — absent).
// Manager sees everything Broker sees (plus unscoped data, applied at the query level,
// not the nav level) but not those two Administrator-only items.
function getNavItems(role: Role): NavItem[] {
  const items: NavItem[] = [
    { icon: <GridIcon />, key: "dashboard", path: "/", group: "workspace" },
    {
      icon: <ListIcon />,
      key: "claims",
      group: "workspace",
      subItems: [
        { key: "claimsAll", path: "/claims" },
        { key: "claimsNew", path: "/claims/new" },
      ],
    },
    { icon: <GroupIcon />, key: "clientsPolicies", path: "/clients", group: "workspace" },
    {
      icon: <DocsIcon />,
      key: "reports",
      group: "insights",
      subItems: [
        { key: "reportsGenerate", path: "/reports" },
        { key: "reportsHistory", path: "/reports/history" },
      ],
    },
    { icon: <TimeIcon />, key: "auditTrail", path: "/audit", group: "insights" },
  ];

  if (role === "administrator") {
    items.push(
      { icon: <UserIcon />, key: "usersAccess", path: "/users", group: "admin" },
      { icon: <FolderIcon />, key: "productConfig", path: "/settings/products", group: "admin" },
      { icon: <PlugInIcon />, key: "companySettings", path: "/settings/company", group: "admin" },
    );
  }

  return items;
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const { currentUser } = useAuth();
  const navItems = useMemo(() => getNavItems(currentUser?.role ?? "broker"), [currentUser?.role]);

  // `items` is one sidebar group; submenu state stays keyed by the item's index in the
  // full navItems list so the route-matching effect below keeps working.
  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "support" | "others",
  ) => (
    <ul className="flex flex-col gap-0.5">
      {items.map((nav) => ({ nav, index: navItems.indexOf(nav) })).map(({ nav, index }) => (
        <li key={nav.key}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={cn(
                "group menu-item cursor-pointer",
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive",
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start",
              )}
            >
              <span
                className={cn(
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive",
                )}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{t(`items.${nav.key}`)}</span>
              )}
              {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={cn(
                    "inset-e-10 absolute ms-auto",
                    openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "menu-dropdown-badge-active"
                      : "menu-dropdown-badge-inactive",
                    "menu-dropdown-badge",
                  )}
                >
                  {t("badges.new")}
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={cn(
                    "ms-auto h-5 w-5 transition-transform duration-200",
                    openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : "",
                  )}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                target={nav.target}
                className={cn(
                  "group menu-item",
                  isActive(nav.path)
                    ? "menu-item-active"
                    : "menu-item-inactive",
                )}
              >
                <span
                  className={cn(
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive",
                  )}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">
                    {t(`items.${nav.key}`)}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="ms-[30px] mt-1 space-y-0.5 border-s border-white/10 ps-3">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.key}>
                    <Link
                      href={subItem.path}
                      target={subItem.target}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {t(`items.${subItem.key}`)}
                      <span className="ms-auto flex items-center gap-1">
                        {subItem.new && (
                          <span
                            className={`ms-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            {t("badges.new")}
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ms-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-pro-active"
                                : "menu-dropdown-badge-pro-inactive"
                            } menu-dropdown-badge-pro`}
                          >
                            {t("badges.pro")}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "support" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main"].forEach((menuType) => {
      const items = navItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "support" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, navItems]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "support" | "others",
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const expanded = isExpanded || isHovered || isMobileOpen;
  const groups: { id: NonNullable<NavItem["group"]>; label: string }[] = [
    { id: "workspace", label: "Workspace" },
    { id: "insights", label: "Insights" },
    { id: "admin", label: "Administration" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-full flex-col border-r border-side-panel-border bg-side-panel px-3 text-gray-100 transition-all duration-300 ease-in-out xl:mt-0 rtl:right-0 rtl:left-auto rtl:border-r-0 rtl:border-l ${
        expanded ? "w-64" : "w-[72px]"
      } ${
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full rtl:translate-x-full"
      } xl:translate-x-0 xl:rtl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex h-16 shrink-0 items-center px-2.5 ${!expanded ? "xl:justify-center xl:px-0" : ""}`}>
        <Link href="/">
          <Wordmark variant={expanded ? "full" : "mark"} tone="onDark" />
        </Link>
      </div>
      <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto pt-3 duration-300 ease-linear">
        <nav className="flex flex-col gap-6">
          {groups.map((group) => {
            const items = navItems.filter((n) => n.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id}>
                <h2
                  className={`mb-1.5 flex h-5 items-center px-2.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase ${
                    !expanded ? "xl:justify-center xl:px-0" : ""
                  }`}
                >
                  {expanded ? group.label : <HorizontaLDots className="size-4" />}
                </h2>
                {renderMenuItems(items, "main")}
              </div>
            );
          })}
        </nav>
      </div>
      {expanded && currentUser && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
          <span className="size-1.5 rounded-full bg-success-500" aria-hidden />
          <span className="text-theme-xs text-gray-400">
            Signed in as <span className="font-medium text-white capitalize">{currentUser.role}</span>
          </span>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
