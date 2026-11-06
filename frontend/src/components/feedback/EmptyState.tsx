import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional icon element, e.g. <FileText />. */
  icon?: ReactNode;
  /** Optional call to action, e.g. a <Button>. */
  action?: ReactNode;
  className?: string;
}

/** Shown when a list or view has nothing to display yet. Server Component. */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-5">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-subheading">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}