import { formatDate } from "@/lib/utils/format";
import type { ActivityItem, ActivityKind } from "@/types/dashboard";

const KIND_LABEL: Record<ActivityKind, string> = {
  upload: "Upload",
  question: "Question",
  edit: "Edit",
  create: "Create",
  export: "Export",
};

export function ActivityFeed({ items }: { items: readonly ActivityItem[] }) {
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <section aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="font-serif text-heading">
        Recent activity
      </h2>
      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="mt-4 space-y-4 border-l pl-4">
          {sorted.map((item) => (
            <li key={item.id}>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {KIND_LABEL[item.kind]} &middot; {formatDate(item.at)}
              </p>
              <p className="mt-0.5 text-sm">{item.description}</p>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Sample data. Nothing here was processed.</p>
    </section>
  );
}
