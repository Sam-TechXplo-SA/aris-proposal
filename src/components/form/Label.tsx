import { FC, ReactNode } from "react";
import { cn } from "@/utils";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

const Label: FC<LabelProps> = ({ htmlFor, children, className }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        // Default classes that apply by default
        "mb-1.5 block text-theme-sm font-medium text-gray-800 dark:text-gray-300",

        // User-defined className that can override the default margin
        className,
      )}
    >
      {children}
    </label>
  );
};

export default Label;
