import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard/components/DashboardView";

// The workspace guard reads a mock session in the browser, so this page
// cannot be prerendered. Opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return <DashboardView />;
}
