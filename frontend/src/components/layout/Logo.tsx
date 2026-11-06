import Link from "next/link";
import { SITE } from "@/lib/constants/site";
import { cn } from "@/lib/utils/cn";

/** Brand mark + name. Server Component; links to the marketing home. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 rounded-sm font-serif text-xl", className)}
    >
      <span
        aria-hidden="true"
        className="flex size-6 items-center justify-center rounded-sm bg-primary text-sm font-semibold text-primary-foreground"
      >
        D
      </span>
      {SITE.name}
    </Link>
  );
}
