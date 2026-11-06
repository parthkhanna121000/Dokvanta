import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/features/marketing/content";
import { cn } from "@/lib/utils/cn";

/** Reusable: rendered on the home page now, and on a /pricing page later. */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="max-w-2xl font-serif text-title">Pricing</h2>
        <p
          role="note"
          className="mt-3 max-w-xl rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm"
        >
          Illustrative plans and prices. This is a prototype: there is no checkout and no payment
          is taken.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col rounded-lg border bg-surface p-6",
                plan.highlighted && "border-primary",
              )}
            >
              <h3 className="font-serif text-heading">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-6">
                <span className="font-serif text-title">{plan.price}</span>{" "}
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="border-l-2 border-brand pl-3">
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlighted ? "default" : "outline"}
                className="mt-8"
              >
                <Link href="/dashboard">Try the prototype</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
