import { PILLARS } from "@/features/marketing/content";

export function Pillars() {
  return (
    <section id="features" className="scroll-mt-16 border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl font-serif text-title">
          One platform for the whole life of a document
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Three tools that share one workspace, one set of documents and one design.
        </p>

        <div className="mt-12 divide-y border-y">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.id}
              id={pillar.id}
              className="scroll-mt-16 grid gap-6 py-10 md:grid-cols-[6rem_1fr_1fr]"
            >
              <p className="font-mono text-sm text-muted-foreground">{pillar.number}</p>
              <div>
                <h3 className="font-serif text-heading">{pillar.name}</h3>
                <p className="mt-2 text-muted-foreground">{pillar.summary}</p>
              </div>
              <ul className="space-y-2 text-sm">
                {pillar.points.map((point) => (
                  <li key={point} className="border-l-2 border-brand pl-3">
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
