import type { Metadata } from "next";
import { DocumentsView } from "@/features/documents/components/DocumentsView";

// Mock session lives in browser storage, so this page cannot be prerendered.
export const instant = false;

export const metadata: Metadata = { title: "My Documents" };

export default function DocumentsPage() {
  return <DocumentsView />;
}
