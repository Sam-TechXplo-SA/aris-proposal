import { cn } from "@/utils";

interface WordmarkProps {
  /** "full" — mark plus name lockup; "mark" — the square monogram alone (collapsed nav). */
  variant?: "full" | "mark";
  /** "brand" for light surfaces; "inverted" for the red sign-in panel; "onDark" for the dark grey sidebar. */
  tone?: "brand" | "inverted" | "onDark";
  className?: string;
}

// Aris brand lockup: a red square monogram next to the name and a small descriptor.
// Text-only — no image asset.
export default function Wordmark({ variant = "full", tone = "brand", className = "" }: WordmarkProps) {
  const inverted = tone === "inverted";
  const mark = (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold tracking-tight",
        inverted ? "bg-white text-brand-600" : "bg-brand-500 text-white shadow-theme-xs",
      )}
      aria-hidden
    >
      A
    </span>
  );

  if (variant === "mark") return <span className={className}>{mark}</span>;

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {mark}
      <span className="flex flex-col leading-none">
        <span className={cn("text-[15px] font-semibold tracking-tight", inverted || tone === "onDark" ? "text-white" : "text-gray-900 dark:text-white")}>
          Aris Brokers
        </span>
        <span className={cn("mt-1 text-[11px] font-medium", inverted ? "text-white/70" : tone === "onDark" ? "text-gray-400" : "text-gray-500 dark:text-gray-400")}>
          Claims System
        </span>
      </span>
    </span>
  );
}
