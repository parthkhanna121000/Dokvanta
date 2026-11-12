import type { Metadata } from "next";
import { ComingSoon } from "@/features/workspace/components/ComingSoon";

// Mock session lives in browser storage, so this page cannot be prerendered.
export const instant = false;

export const metadata: Metadata = { title: "AI Intelligence" };

export default function Page() {
  return <ComingSoon title="AI Intelligence" phase="Phase 6" />;
}
