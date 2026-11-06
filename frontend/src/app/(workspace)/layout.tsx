import { Logo } from "@/components/layout/Logo";

/**
 * Plain shell for now. Phase 3 adds the client-side session guard (mock only,
 * not real security); Phase 4 replaces this with the sidebar and top bar.
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b bg-surface">
        <div className="flex h-14 items-center px-6">
          <Logo />
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </>
  );
}
