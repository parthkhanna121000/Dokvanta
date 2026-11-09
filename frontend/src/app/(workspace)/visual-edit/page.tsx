import type { Metadata } from "next";
import { ComingSoon } from "@/features/workspace/components/ComingSoon";

// Mock session lives in browser storage, so this page cannot be prerendered.
export const instant = false;

export const metadata: Metadata = { title: "AI Visual Edit" };

export default function Page() {
  return <ComingSoon title="AI Visual Edit" phase="Phase 7" />;
}
