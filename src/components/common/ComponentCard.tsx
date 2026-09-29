import { cn } from "@/utils";
import React from "react";

interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  /** Optional right-aligned header content, e.g. a link or button. */
  action?: React.ReactNode;
  /** Drop the body padding — for tables and lists that run edge to edge. */
  flush?: boolean;
}

// The standard surface for grouped content: hairline border, compact header, and a
// body separated by a single rule. Used across both portals.
const ComponentCard: React.FC<ComponentCardProps> = ({ title, children, className = "", desc = "", action, flush = false }) => {
  return (
    <section className={cn("rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-900", className)}>
      <header className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white/90">{title}</h3>
          {desc && <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{desc}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn("border-t border-gray-100 dark:border-gray-800", !flush && "p-5")}>
        {flush ? children : <div className="space-y-5">{children}</div>}
      </div>
    </section>
  );
};

export default ComponentCard;
