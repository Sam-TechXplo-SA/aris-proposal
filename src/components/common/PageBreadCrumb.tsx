import { Link } from "@/i18n/navigation";
import { ChevronRightIcon } from "@/icons";
import type { ReactNode } from "react";

interface BreadcrumbProps {
  pageTitle: string;
  /** Optional one-line description under the title. */
  description?: string;
  /** Optional right-aligned actions (primary button etc.). */
  actions?: ReactNode;
  /** Parent crumbs between Home and the current page. */
  parents?: { label: string; href: string }[];
}

// Page header used by every Admin Portal page: small breadcrumb trail above a
// compact title, with room for a description and page-level actions.
const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, description, actions, parents = [] }) => {
  const crumbs = [{ label: "Home", href: "/" }, ...parents];
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-1.5">
          <ol className="flex items-center gap-1 text-theme-xs text-gray-500 dark:text-gray-400">
            {crumbs.map((c) => (
              <li key={c.href} className="flex items-center gap-1">
                <Link href={c.href} className="hover:text-gray-800 dark:hover:text-gray-200">
                  {c.label}
                </Link>
                <ChevronRightIcon className="size-3 text-gray-300 rtl:rotate-180 dark:text-gray-600" />
              </li>
            ))}
            <li className="truncate text-gray-700 dark:text-gray-300" aria-current="page">
              {pageTitle}
            </li>
          </ol>
        </nav>
        <h1 className="truncate text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white/90">{pageTitle}</h1>
        {description && <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageBreadcrumb;
