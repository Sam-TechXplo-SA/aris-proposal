import { Link } from "@/i18n/navigation";
import { cn } from "@/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon?: ReactNode;
  href?: string;
  /** "attention" tints the icon red — use only when the number means work is waiting. */
  tone?: "default" | "attention";
}

// Dashboard KPI tile: label, figure, one line of context. Links through to the
// filtered list when `href` is given.
export default function StatCard({ label, value, hint, icon, href, tone = "default" }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-theme-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {icon && (
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg [&_svg]:size-4",
              tone === "attention" ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-title-sm font-semibold tracking-tight text-gray-900 tabular-nums dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </>
  );
  const cls = "block rounded-xl border border-gray-200 bg-white p-5 shadow-card dark:border-gray-800 dark:bg-gray-900";
  return href ? (
    <Link href={href} className={cn(cls, "transition-colors hover:border-gray-300 dark:hover:border-gray-700")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
