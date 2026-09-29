import { CheckLineIcon } from "@/icons";
import { cn } from "@/utils";

export interface StepDefinition {
  key: string;
  label: string;
  /** Full name shown on hover and in the mobile view, when `label` is a shortened form. */
  fullLabel?: string;
}

interface StepProgressProps {
  steps: StepDefinition[];
  currentIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

/**
 * Shared step-progress indicator — every phase/wizard stepper in the app renders through
 * this one component. Used by the Client's 5-step New Claim wizard (ux-blueprint.md §15),
 * ClaimFormWizard's per-section phases (§6.11), and the Insurer & Assessor
 * assessment-milestone tracker. Steps sit in equal-width columns (number on the line, label
 * underneath) so long forms of 10+ sections stay in order instead of wrapping unevenly.
 * Completed steps are clickable (jump back) when `onStepClick` is provided; the current
 * step and anything ahead are not, until reached in order.
 */
const StepProgress: React.FC<StepProgressProps> = ({ steps, currentIndex, onStepClick, className = "" }) => {
  return (
    <div className={cn(className)}>
      {/* Desktop / tablet: equal columns, labels from md */}
      <ol className="hidden sm:grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Progress">
        {steps.map((step, index) => {
          const state = index < currentIndex ? "completed" : index === currentIndex ? "active" : "inactive";
          const clickable = !!onStepClick && state === "completed";
          const Tag = clickable ? "button" : "div";
          return (
            <li key={step.key} className="relative min-w-0" aria-current={state === "active" ? "step" : undefined}>
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3.5 right-1/2 left-[-50%] h-0.5 -translate-y-1/2",
                    index <= currentIndex ? "bg-gray-900 dark:bg-gray-300" : "bg-gray-200 dark:bg-gray-800",
                  )}
                />
              )}
              <Tag
                {...(clickable ? { type: "button" as const, onClick: () => onStepClick!(index) } : {})}
                title={step.fullLabel ?? step.label}
                className={cn("group relative flex w-full flex-col items-center text-center", clickable && "cursor-pointer")}
              >
                <span
                  className={cn(
                    "relative z-1 flex size-7 shrink-0 items-center justify-center rounded-full text-theme-xs font-semibold transition-colors",
                    state === "completed" && "bg-gray-900 text-white group-hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-900",
                    state === "active" && "bg-brand-500 text-white ring-4 ring-brand-500/15",
                    state === "inactive" && "border border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
                  )}
                >
                  {state === "completed" ? <CheckLineIcon className="size-3.5" aria-hidden /> : index + 1}
                </span>
                <span
                  className={cn(
                    "mt-2 hidden w-full truncate px-0.5 text-theme-xs md:block",
                    state === "active" && "font-semibold text-gray-900 dark:text-white",
                    state === "completed" && "text-gray-700 group-hover:text-gray-900 dark:text-gray-300",
                    state === "inactive" && "text-gray-400 dark:text-gray-500",
                  )}
                >
                  {step.label}
                </span>
              </Tag>
            </li>
          );
        })}
      </ol>

      {/* Mobile: condensed label + progress bar — one field-group per screen (§20.2) */}
      <div className="sm:hidden">
        <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
          Step {currentIndex + 1} of {steps.length}
        </p>
        <p className="mt-0.5 text-theme-sm font-semibold text-gray-800 dark:text-white/90">{steps[currentIndex]?.fullLabel ?? steps[currentIndex]?.label}</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
