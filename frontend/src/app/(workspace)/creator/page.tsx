import type { Metadata } from "next";
import { ComingSoon } from "@/features/workspace/components/ComingSoon";

// Mock session lives in browser storage, so this page cannot be prerendered.
export const instant = false;

export const metadata: Metadata = { title: "Document Creator" };

export default function Page() {
  return <ComingSoon title="Document Creator" phase="Phase 8" />;
}
