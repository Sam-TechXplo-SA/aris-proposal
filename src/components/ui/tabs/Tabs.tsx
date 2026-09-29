import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";

export interface TabItem {
  key: string;
  label: string;
  badge?: number;
  /** When set, the tab renders as a link (route-based tabs) instead of a state toggle. */
  href?: string;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange?: (key: string) => void;
  className?: string;
}

// Shared tab primitive — used by admin Claim Detail (Overview/Documents/Insurer &
// Assessor/Decision & Settlement/Financials/Communication/Comments/Activity, §7.3).
// Supports both route-based tabs (pass `href` per item) and controlled in-page tabs
// (omit `href`, handle `onChange`).
const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className = "" }) => {
  return (
    <div className={cn("no-scrollbar overflow-x-auto border-b border-gray-200 dark:border-gray-800", className)}>
      <nav className="flex min-w-max gap-6">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const content = (
            <>
              {tab.label}
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  {tab.badge}
                </span>
              )}
              {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500" />}
            </>
          );
          const className = cn(
            "relative flex items-center gap-1.5 py-3 text-theme-sm font-medium transition-colors",
            isActive
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
          );
          return tab.href ? (
            <Link key={tab.key} href={tab.href} className={className}>
              {content}
            </Link>
          ) : (
            <button key={tab.key} type="button" onClick={() => onChange?.(tab.key)} className={className}>
              {content}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Tabs;
