import { ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// globals.css defines custom font-size tokens (text-theme-sm, text-title-md…). Without
// registering them, twMerge reads them as text *colours* and drops them whenever a real
// colour class (text-gray-700) appears in the same cn() call.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["theme-xs", "theme-sm", "theme-xl", "title-sm", "title-md", "title-lg", "title-xl", "title-2xl"] }],
    },
  },
});

/**
 * Combines and merges Tailwind CSS class names with conditional logic.
 * @example
 * cn("bg-white", isActive && "text-black", "px-4") → "bg-white text-black px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
