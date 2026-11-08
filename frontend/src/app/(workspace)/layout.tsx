import { Logo } from "@/components/layout/Logo";
import { WorkspaceGuard } from "@/components/layout/WorkspaceGuard";
import { SessionControls } from "@/features/auth/components/SessionControls";

// Mock session lives in browser storage, so this section cannot be prerendered.
// Opt out of instant-navigation validation. Revisit when real auth exists.
export const instant = false;

/**
 * Plain shell for now. The guard is frontend-only (mock, not real security).
 * Phase 4 replaces the header with the sidebar and top bar.
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceGuard>
      <header className="border-b bg-surface">
        <div className="flex h-14 items-center px-6">
          <Logo />
          <SessionControls />
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </WorkspaceGuard>
  );
}
