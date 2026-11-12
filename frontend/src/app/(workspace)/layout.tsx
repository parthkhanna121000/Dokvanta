import { WorkspaceGuard } from "@/components/layout/WorkspaceGuard";
import { WorkspaceShell } from "@/features/workspace/components/WorkspaceShell";

// Mock session lives in browser storage, so this section cannot be prerendered.
// Opt out of instant-navigation validation. Revisit when real auth exists.
export const instant = false;

/** Server layout: the guard (mock, not real security) wraps the client shell. */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceGuard>
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceGuard>
  );
}
