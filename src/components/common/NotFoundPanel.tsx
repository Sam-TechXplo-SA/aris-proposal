import { Link } from "@/i18n/navigation";
import Image from "next/image";

/**
 * Inline "not found" state for a scoped record a user isn't allowed to see — reads as
 * "not found," never "forbidden," per ux-blueprint.md §3.5, so an unauthorised user
 * can't tell the record exists. Renders inside the normal portal shell rather than a
 * full-page takeover, since only this one record is missing.
 */
export default function NotFoundPanel({ backHref, backLabel = "Back to Claims" }: { backHref: string; backLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white shadow-card px-6 py-16 text-center dark:border-gray-800 dark:bg-white/3">
      <Image src="/images/error/404.svg" alt="" className="dark:hidden" width={220} height={72} />
      <Image src="/images/error/404-dark.svg" alt="" className="hidden dark:block" width={220} height={72} />
      <p className="mt-6 text-theme-sm text-gray-500 dark:text-gray-400">
        We couldn&apos;t find that record. It may not exist, or it may not be available to you.
      </p>
      <Link href={backHref} className="mt-4 text-theme-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
        {backLabel}
      </Link>
    </div>
  );
}
