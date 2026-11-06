import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="brand">Brand</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button asChild variant="outline">
            <a href="#">Rendered as a link</a>
          </Button>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-sm gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="preview-email">Email</Label>
            <Input id="preview-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="preview-invalid">Invalid field</Label>
            <Input id="preview-invalid" aria-invalid="true" defaultValue="not-an-email" />
            <p className="text-xs text-danger">Enter a valid email address.</p>
          </div>
        </div>
      </Section>

      <Section title="Status badges (text label always present)">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="brand">Processing</Badge>
          <Badge variant="success">Ready</Badge>
          <Badge variant="warning">Needs review</Badge>
          <Badge variant="danger">Failed</Badge>
          <Badge variant="info">Draft</Badge>
          <Badge variant="outline">PDF</Badge>
        </div>
      </Section>

      <Section title="Separator and skeleton">
        <div className="max-w-sm space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Separator />
          <div className="flex h-5 items-center gap-3 text-sm">
            <span>Pages</span>
            <Separator orientation="vertical" />
            <span>Revisions</span>
          </div>
        </div>
      </Section>

      <Section title="Empty and error states">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            icon={<FileText />}
            title="No documents yet"
            description="Upload a PDF or create a document to get started."
            action={<Button>Upload PDF</Button>}
          />
          <ErrorState
            title="Could not load documents"
            description="The mock service returned an error."
            action={<Button variant="outline">Try again</Button>}
          />
        </div>
      </Section>

      <Section title="Shape and elevation">
        <div className="flex flex-wrap gap-4">
          <div className="rounded-md border bg-surface p-4 text-sm">Border only (default)</div>
          <div className="rounded-lg bg-popover p-4 text-sm shadow-popover">Popover shadow</div>
          <div className="rounded-xl bg-popover p-4 text-sm shadow-dialog">Dialog shadow</div>
        </div>
      </Section>
    </main>
  );
}