import Link from "next/link";
import { FilePenLine, FilePlus2, MessageSquareText, type LucideIcon } from "lucide-react";

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const LINKS: readonly QuickLink[] = [
  { title: "AI Intelligence", description: "Ask questions and get cited answers.", href: "/intelligence", icon: MessageSquareText },
  { title: "AI Visual Edit", description: "Review proposed changes before committing.", href: "/visual-edit", icon: FilePenLine },
  { title: "Document Creator", description: "Draft from a prompt, template or text.", href: "/creator", icon: FilePlus2 },
];

export function QuickAccess() {
  return (
    <section aria-labelledby="quick-heading">
      <h2 id="quick-heading" className="font-serif text-heading">
        Quick access
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex h-full flex-col gap-2 rounded-lg border bg-surface p-4 transition-colors hover:bg-accent"
            >
              <link.icon className="size-5 text-brand" aria-hidden="true" />
              <span className="text-sm font-medium">{link.title}</span>
              <span className="text-xs text-muted-foreground">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
