import { cn } from "@/utils";
import Image from "next/image";

interface WordmarkProps {
  /** "full" — the Aris Brokers logo lockup; "mark" — the Africa stripes alone (collapsed nav). */
  variant?: "full" | "mark";
  /** "brand" follows the light/dark theme; "onDark" for always-dark surfaces (sidebar, sign-in panel). */
  tone?: "brand" | "onDark";
  /** "lg" for hero placements such as the sign-in panel. */
  size?: "md" | "lg";
  className?: string;
}

const LOGO = { w: 626, h: 203 };
const MARK = { w: 150, h: 169 };

// Aris Brokers logo. The "-on-dark" assets lift the grey "BROKERS" and the red so they hold contrast on charcoal.
export default function Wordmark({ variant = "full", tone = "brand", size: scale = "md", className = "" }: WordmarkProps) {
  const size = variant === "mark" ? MARK : LOGO;
  const name = variant === "mark" ? "aris-mark" : "aris-logo";
  const sizing = variant === "mark" ? "h-8 w-auto" : scale === "lg" ? "h-20 w-auto" : "h-10 w-auto";

  const img = (src: string, extra = "") => (
    <Image src={src} alt="Aris Brokers" width={size.w} height={size.h} priority className={cn(sizing, extra)} />
  );

  if (tone === "onDark") return <span className={cn("inline-flex", className)}>{img(`/images/logo/${name}-on-dark.png`)}</span>;

  return (
    <span className={cn("inline-flex", className)}>
      {img(`/images/logo/${name}.png`, "dark:hidden")}
      {img(`/images/logo/${name}-on-dark.png`, "hidden dark:block")}
    </span>
  );
}
