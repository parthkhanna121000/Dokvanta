/**
 * Three static sample panels showing the core workflows.
 * Illustration only: sample content, not interactive, nothing is processed.
 */
export function Demo() {
  return (
    <section id="demo" className="scroll-mt-16 border-t bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl font-serif text-title">See a document at work</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          One sample proposal, three ways to work with it.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">
          <article className="bg-background p-6">
            <p className="font-mono text-xs text-muted-foreground">Ask</p>
            <h3 className="mt-1 font-serif text-subheading">Question with sources</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p className="rounded-md bg-muted px-3 py-2">What are the main project risks?</p>
              <p>
                The proposal names supplier delays and a tight integration schedule as the main
                risks.{" "}
                <span className="rounded-sm border px-1.5 py-0.5 text-xs font-medium text-brand">
                  Page 9
                </span>{" "}
                <span className="rounded-sm border px-1.5 py-0.5 text-xs font-medium text-brand">
                  Page 14
                </span>
              </p>
            </div>
          </article>

          <article className="bg-background p-6">
            <p className="font-mono text-xs text-muted-foreground">Edit</p>
            <h3 className="mt-1 font-serif text-subheading">Change under review</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p className="rounded-md bg-muted px-3 py-2">
                Make the executive summary more concise.
              </p>
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Rewrite paragraph &middot; Page 2 &middot; Pending
                </p>
                <p className="mt-2 text-danger line-through">
                  This document sets out in considerable detail the overall approach.
                </p>
                <p className="mt-1 text-success underline">This document outlines our approach.</p>
              </div>
            </div>
          </article>

          <article className="bg-background p-6">
            <p className="font-mono text-xs text-muted-foreground">Create</p>
            <h3 className="mt-1 font-serif text-subheading">Draft from a prompt</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p className="rounded-md bg-muted px-3 py-2">
                Write a project proposal for a software development company.
              </p>
              <ol className="list-decimal space-y-1 pl-5 font-serif">
                <li>Executive summary</li>
                <li>Scope and deliverables</li>
                <li>Timeline and milestones</li>
                <li>Budget</li>
              </ol>
            </div>
          </article>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Illustration with sample content. Responses in the prototype are simulated.
        </p>
      </div>
    </section>
  );
}
