import { FAQS } from "@/features/marketing/content";

/** Native <details>: keyboard accessible and needs no client JavaScript. */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t bg-surface">
      <div className="mx-auto w-full max-w-3xl px-6 py-20">
        <h2 className="font-serif text-title">Questions</h2>
        <div className="mt-10 divide-y border-y">
          {FAQS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
