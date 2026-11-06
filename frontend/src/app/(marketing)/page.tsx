import { SITE } from "@/lib/constants/site";

export default function MarketingHomePage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <p className="text-sm text-muted-foreground">{SITE.descriptor}</p>
      <h1 className="mt-3 max-w-3xl font-serif text-display">{SITE.tagline}</h1>
      <p className="mt-4 max-w-xl text-subheading text-muted-foreground">
        {SITE.pillars.join(". ")}.
      </p>
      <p className="mt-10 text-sm text-muted-foreground">
        Placeholder. The full landing page is built in Phase 2.
      </p>
    </section>
  );
}
