import * as React from "react";
import { cn } from "@/lib/utils/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-surface px-3 py-1 text-sm transition-colors",
        "placeholder:text-muted-foreground",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Input };