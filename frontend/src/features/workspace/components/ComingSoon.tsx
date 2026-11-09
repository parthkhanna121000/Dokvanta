import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";

/** Placeholder for workspace sections built in later phases. Keeps navigation free of dead pages. */
export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="font-serif text-title">{title}</h1>
      <EmptyState
        className="mt-8"
        icon={<Hammer />}
        title="Not built yet"
        description={`This section is built in ${phase}. It is a placeholder so navigation never leads to a dead page.`}
      />
    </div>
  );
}
