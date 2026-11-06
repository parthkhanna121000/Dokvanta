import { STEPS } from "@/features/marketing/content";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl font-serif text-title">How it works</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.number} className="border-t-2 border-primary pt-4">
              <p className="font-mono text-sm text-muted-foreground">{step.number}</p>
              <h3 className="mt-2 font-serif text-subheading">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
