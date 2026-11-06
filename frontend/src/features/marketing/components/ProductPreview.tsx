/**
 * Static illustration of the workspace, built from HTML and CSS.
 * It is not interactive and uses sample content only. role="img" with a label
 * lets screen readers skip the decorative internals.
 */
export function ProductPreview() {
  return (
    <figure>
      <div
        role="img"
        aria-label="Illustration of the Dokvanta workspace: a document on the left, a cited answer and a proposed edit on the right."
        className="overflow-hidden rounded-lg border bg-surface"
      >
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Q3 Project Proposal.pdf</span>
          <span>Page 12 of 28</span>
        </div>

        <div className="grid md:grid-cols-[1fr_20rem]">
          {/* Document page */}
          <div className="bg-muted p-6 md:p-10">
            <div className="mx-auto max-w-md bg-surface p-8 shadow-popover">
              <p className="font-serif text-lg">4. System architecture</p>
              <p className="mt-3 font-serif text-sm leading-relaxed">
                <span className="bg-brand/10 px-0.5">
                  The platform uses a distributed architecture, with each service deployed
                  independently.
                </span>{" "}
                Requests are routed through a gateway that handles authentication and rate
                limiting before reaching downstream services.
              </p>
              <p className="mt-3 font-serif text-sm leading-relaxed">
                Delivery is planned in{" "}
                <span className="bg-danger-soft text-danger line-through">three</span>{" "}
                <span className="bg-success-soft px-0.5 text-success underline">four</span>{" "}
                phases over the first two quarters.
              </p>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4 border-t p-4 text-sm md:border-l md:border-t-0">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Question
              </p>
              <p className="mt-1">How is the system architecture organised?</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Answer
              </p>
              <p className="mt-1">
                Services are deployed independently behind a gateway that handles authentication
                and rate limiting.{" "}
                <span className="rounded-sm border px-1.5 py-0.5 text-xs font-medium text-brand">
                  Page 12
                </span>
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Proposed change
              </p>
              <p className="mt-1">Replace &ldquo;three&rdquo; with &ldquo;four&rdquo; phases.</p>
              <div className="mt-2 flex gap-2 text-xs font-medium">
                <span className="rounded-sm bg-primary px-2 py-1 text-primary-foreground">
                  Accept
                </span>
                <span className="rounded-sm border px-2 py-1">Reject</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground">
        Illustration with sample content. Not a live document.
      </figcaption>
    </figure>
  );
}
