import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { MARKETING_NAV } from "@/lib/constants/navigation";
import { SITE } from "@/lib/constants/site";

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{SITE.descriptor}.</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">{SITE.tagline}</p>
        </div>

        <nav aria-label="Footer product">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Product
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Footer account">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Account
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/login" className="hover:underline">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:underline">
                Get started
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-6 py-4 text-xs text-muted-foreground">
          Dokvanta V1 is a frontend prototype. AI features and data shown in the app are simulated.
        </p>
      </div>
    </footer>
  );
}
