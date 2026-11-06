import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Optional action, e.g. a retry <Button>. Passed in so this stays a Server Component. */
  action?: ReactNode;
  className?: string;
}

/** Shown when loading or a mock operation fails. Uses role="alert" for screen readers. */
export function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If the problem continues, reload the page.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-lg border border-danger/30 bg-danger-soft px-6 py-10 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mb-3 flex size-8 items-center justify-center rounded-full border border-danger text-sm font-semibold text-danger"
      >
        !
      </span>
      <h3 className="font-serif text-subheading text-danger">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-foreground/80">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}