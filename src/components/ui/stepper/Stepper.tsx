"use client";

import { CheckLineIcon } from "@/icons";
import { cn } from "@/utils";
import * as React from "react";
import { createContext, useContext } from "react";

type StepState = "active" | "completed" | "inactive" | "loading";

type StepperContextValue = {
  activeStep: number;
  setActiveStep: (step: number) => void;
  orientation: "horizontal" | "vertical";
};

type StepItemContextValue = {
  step: number;
  state: StepState;
  isDisabled: boolean;
  isLoading: boolean;
};

const StepperContext = createContext<StepperContextValue | undefined>(undefined);
const StepItemContext = createContext<StepItemContextValue | undefined>(undefined);

const useStepper = () => {
  const context = useContext(StepperContext);
  if (!context) throw new Error("useStepper must be used within a Stepper");
  return context;
};

const useStepItem = () => {
  const context = useContext(StepItemContext);
  if (!context) throw new Error("useStepItem must be used within a StepperItem");
  return context;
};

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  orientation?: "horizontal" | "vertical";
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    { defaultValue = 0, value, onValueChange, orientation = "horizontal", className, ...props },
    ref,
  ) => {
    const [activeStep, setInternalStep] = React.useState(defaultValue);

    const setActiveStep = React.useCallback(
      (step: number) => {
        if (value === undefined) setInternalStep(step);
        onValueChange?.(step);
      },
      [value, onValueChange],
    );

    const currentStep = value ?? activeStep;

    return (
      <StepperContext.Provider value={{ activeStep: currentStep, setActiveStep, orientation }}>
        <div
          ref={ref}
          className={cn(
            "group/stepper flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
            className,
          )}
          data-orientation={orientation}
          {...props}
        />
      </StepperContext.Provider>
    );
  },
);
Stepper.displayName = "Stepper";

interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  completed?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
  (
    { step, completed = false, disabled = false, loading = false, className, children, ...props },
    ref,
  ) => {
    const { activeStep } = useStepper();

    const state: StepState =
      completed || step < activeStep ? "completed" : activeStep === step ? "active" : "inactive";

    const isLoading = loading && step === activeStep;

    return (
      <StepItemContext.Provider value={{ step, state, isDisabled: disabled, isLoading }}>
        <div
          ref={ref}
          className={cn(
            "group/step flex items-center gap-3 group-data-[orientation=horizontal]/stepper:flex-1 group-data-[orientation=horizontal]/stepper:last:flex-none group-data-[orientation=vertical]/stepper:flex-col group-data-[orientation=vertical]/stepper:gap-2 group-data-[orientation=vertical]/stepper:items-start",
            className,
          )}
          data-state={state}
          {...(isLoading ? { "data-loading": "true" } : {})}
          {...props}
        >
          {children}
        </div>
      </StepItemContext.Provider>
    );
  },
);
StepperItem.displayName = "StepperItem";

interface StepperTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const StepperTrigger = React.forwardRef<HTMLButtonElement, StepperTriggerProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const { setActiveStep } = useStepper();
    const { step, isDisabled } = useStepItem();

    if (asChild) {
      return <div className={className}>{children}</div>;
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-3 text-start disabled:pointer-events-none",
          className,
        )}
        onClick={() => setActiveStep(step)}
        disabled={isDisabled}
        {...props}
      >
        {children}
      </button>
    );
  },
);
StepperTrigger.displayName = "StepperTrigger";

interface StepperIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const StepperIndicator = React.forwardRef<HTMLDivElement, StepperIndicatorProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const { state, step, isLoading } = useStepItem();

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex size-7 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-theme-xs font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400",
          "data-[state=active]:border-brand-500 data-[state=active]:bg-brand-500 data-[state=active]:text-white data-[state=active]:ring-4 data-[state=active]:ring-brand-500/15 dark:data-[state=active]:bg-brand-500 dark:data-[state=active]:text-white",
          "data-[state=completed]:border-gray-900 data-[state=completed]:bg-gray-900 data-[state=completed]:text-white dark:data-[state=completed]:border-gray-200 dark:data-[state=completed]:bg-gray-200 dark:data-[state=completed]:text-gray-900",
          className,
        )}
        data-state={state}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            <span className="transition-all group-data-[state=completed]/step:scale-0 group-data-[state=completed]/step:opacity-0 group-data-[loading=true]/step:scale-0 group-data-[loading=true]/step:opacity-0 group-data-[loading=true]/step:transition-none">
              {step}
            </span>
            <CheckLineIcon
              className="absolute size-3.5 scale-0 opacity-0 transition-all group-data-[state=completed]/step:scale-100 group-data-[state=completed]/step:opacity-100"
              aria-hidden="true"
            />
            {isLoading && (
              <span
                className="absolute size-3.5 animate-spin rounded-full border-2 border-current border-s-transparent"
                aria-hidden="true"
              />
            )}
          </>
        )}
      </div>
    );
  },
);
StepperIndicator.displayName = "StepperIndicator";

type StepperTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const StepperTitle = React.forwardRef<HTMLHeadingElement, StepperTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-theme-sm font-medium text-gray-500 dark:text-gray-400",
        "group-data-[state=active]/step:text-gray-900 dark:group-data-[state=active]/step:text-white",
        "group-data-[state=completed]/step:text-gray-700 dark:group-data-[state=completed]/step:text-gray-300",
        className,
      )}
      {...props}
    />
  ),
);
StepperTitle.displayName = "StepperTitle";

type StepperSeparatorProps = React.HTMLAttributes<HTMLDivElement>;

const StepperSeparator = React.forwardRef<HTMLDivElement, StepperSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-full bg-gray-200 group-data-[orientation=horizontal]/stepper:mx-1 dark:bg-gray-800",
        "group-data-[orientation=horizontal]/stepper:h-0.5 group-data-[orientation=horizontal]/stepper:w-full group-data-[orientation=horizontal]/stepper:flex-1",
        "group-data-[orientation=vertical]/stepper:h-full group-data-[orientation=vertical]/stepper:w-0.5 group-data-[orientation=vertical]/stepper:flex-none",
        "group-data-[state=completed]/step:bg-gray-900 dark:group-data-[state=completed]/step:bg-gray-300",
        className,
      )}
      {...props}
    />
  ),
);
StepperSeparator.displayName = "StepperSeparator";

export { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger };

export default Stepper;