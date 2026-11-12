import { formatBytes } from "@/lib/utils/format";
import type { StorageUsage as StorageUsageData } from "@/types/dashboard";

export function StorageUsage({ usage }: { usage: StorageUsageData }) {
  const percent = Math.min(100, Math.round((usage.usedBytes / usage.totalBytes) * 100));

  return (
    <section aria-labelledby="storage-heading" className="rounded-lg border bg-surface p-4">
      <h2 id="storage-heading" className="font-serif text-heading">
        Storage
      </h2>
      <p className="mt-2 text-sm">
        {formatBytes(usage.usedBytes)} of {formatBytes(usage.totalBytes)} used ({percent}%)
      </p>
      <div
        role="progressbar"
        aria-label="Storage used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Illustrative values. Prototype files are kept in this browser session only.
      </p>
    </section>
  );
}
