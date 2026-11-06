import Link from "next/link";
import { ProductPreview } from "@/features/marketing/components/ProductPreview";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants/site";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-16 md:pt-24">
      <p className="text-sm text-muted-foreground">{SITE.descriptor}</p>
      <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight md:text-display">
        {SITE.tagline}
      </h1>
      <p className="mt-5 max-w-xl text-subheading text-muted-foreground">
        Create, understand, edit and transform documents in one place. Ask questions with
        page-level sources, review every proposed change, and export clean PDFs.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">Get started</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/#features">Explore features</Link>
        </Button>
      </div>

      <div className="mt-14">
        <ProductPreview />
      </div>
    </section>
  );
}
