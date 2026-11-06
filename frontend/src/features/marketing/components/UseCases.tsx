import { USE_CASES } from "@/features/marketing/content";

export function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-16 border-t bg-surface">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl font-serif text-title">Built for how people read and write</h2>
        <dl className="mt-12 divide-y border-y">
          {USE_CASES.map((item) => (
            <div key={item.audience} className="grid gap-2 py-5 md:grid-cols-[14rem_1fr]">
              <dt className="font-serif text-subheading">{item.audience}</dt>
              <dd className="text-muted-foreground">{item.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
