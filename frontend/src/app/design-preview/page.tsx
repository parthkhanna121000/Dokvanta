import type { Metadata } from "next";

export const metadata: Metadata = { title: "Design preview" };

const SWATCHES = [
  { name: "background", cls: "bg-background" },
  { name: "surface", cls: "bg-surface" },
  { name: "muted", cls: "bg-muted" },
  { name: "accent", cls: "bg-accent" },
  { name: "primary", cls: "bg-primary" },
  { name: "brand", cls: "bg-brand" },
  { name: "border", cls: "bg-border" },
];

const STATUSES = [
  { label: "Success", cls: "bg-success-soft text-success" },
  { label: "Warning", cls: "bg-warning-soft text-warning" },
  { label: "Danger", cls: "bg-danger-soft text-danger" },
  { label: "Info", cls: "bg-info-soft text-info" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-6">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignPreviewPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-6 py-12">
      <header>
        <p className="text-sm text-muted-foreground">Temporary page. Delete after Phase 1C.</p>
        <h1 className="font-serif text-display">Documents, without limits.</h1>
        <p className="mt-3 max-w-xl text-subheading text-muted-foreground">
          Dokvanta is the document technology platform. Create. Understand. Edit. Transform.
        </p>
      </header>

      <Section title="Type scale">
        <div className="space-y-3">
          <p className="font-serif text-title">Title, Newsreader</p>
          <p className="font-serif text-heading">Heading, Newsreader</p>
          <p className="text-subheading font-medium">Subheading, Geist</p>
          <p className="text-base">Body text in Geist, for interface copy and descriptions.</p>
          <p className="text-sm text-muted-foreground">Small muted text for metadata and captions.</p>
          <p className="font-mono text-sm">Monospace for ids and file sizes: 2.4 MB</p>
          <p className="max-w-prose font-serif text-lg leading-relaxed">
            Long-form document content is set in the serif at a comfortable measure. Good
            reading rhythm matters when people spend hours inside documents.
          </p>
        </div>
      </Section>

      <Section title="Color tokens">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <li key={s.name}>
              <div className={`h-14 rounded-md border ${s.cls}`} />
              <p className="mt-1 text-xs text-muted-foreground">{s.name}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Status (always paired with a text label)">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <span key={s.label} className={`rounded-sm px-2.5 py-1 text-sm font-medium ${s.cls}`}>
              {s.label}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Shape and elevation">
        <div className="flex flex-wrap gap-4">
          <div className="rounded-md border bg-surface p-4 text-sm">Border only (default)</div>
          <div className="rounded-lg bg-popover p-4 text-sm shadow-popover">Popover shadow</div>
          <div className="rounded-xl bg-popover p-4 text-sm shadow-dialog">Dialog shadow</div>
        </div>
      </Section>

      <Section title="Links and focus">
        <p className="text-sm">
          A{" "}
          <a href="#" className="text-brand underline underline-offset-4">
            brand link
          </a>
          . Press Tab to see the focus ring on it.
        </p>
      </Section>
    </main>
  );
}