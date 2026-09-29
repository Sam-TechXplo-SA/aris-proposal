import { CheckLineIcon } from "@/icons";
import { CLIENT_STAGES, clientStageLabel, clientStageOf } from "@/lib/mock/clientStatus";
import { useData } from "@/lib/mock/store";
import type { ClaimStatus } from "@/lib/mock/types";
import { cn } from "@/utils";

// 5-stage horizontal tracker for the User Portal (UC-03). Completed stages are checked,
// the current stage is highlighted (amber when it's waiting on the client), later stages
// are greyed out. A finalised claim shows every stage complete.
export default function ClientStageTracker({ status, blocking }: { status: ClaimStatus; blocking: boolean }) {
  const { state } = useData();
  const current = CLIENT_STAGES.indexOf(clientStageOf(status));
  const finalised = current === CLIENT_STAGES.length - 1;

  return (
    <ol className="grid grid-cols-5" aria-label="Claim progress">
      {CLIENT_STAGES.map((stage, i) => {
        const done = i < current || finalised;
        const isCurrent = i === current && !finalised;
        const tone = isCurrent ? (blocking ? "amber" : "blue") : done ? "done" : "future";

        return (
          <li key={stage} className="relative flex flex-col items-center text-center" aria-current={isCurrent ? "step" : undefined}>
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-3.5 right-1/2 left-[-50%] h-0.5 -translate-y-1/2",
                  i <= current ? "bg-gray-800 dark:bg-gray-300" : "bg-gray-200 dark:bg-gray-700",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-1 flex size-7 items-center justify-center rounded-full text-theme-xs font-semibold",
                tone === "done" && "bg-gray-800 text-white dark:bg-gray-300 dark:text-gray-900",
                tone === "amber" && "bg-warning-500 text-white ring-4 ring-warning-100 dark:ring-warning-500/25",
                tone === "blue" && "bg-blue-light-500 text-white ring-4 ring-blue-light-100 dark:ring-blue-light-500/25",
                tone === "future" && "border-2 border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500",
              )}
            >
              {done ? <CheckLineIcon className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "mt-2 px-1 text-[11px] leading-tight sm:text-theme-xs",
                tone === "amber" && "font-semibold text-warning-700 dark:text-warning-300",
                tone === "blue" && "font-semibold text-blue-light-700 dark:text-blue-light-300",
                tone === "done" && "text-gray-700 dark:text-gray-300",
                tone === "future" && "text-gray-400 dark:text-gray-500",
              )}
            >
              {clientStageLabel(state, stage)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
