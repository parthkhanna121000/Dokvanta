import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { DocumentStatus } from "@/types/document";

const STATUS: Record<DocumentStatus, { label: string; variant: NonNullable<BadgeProps["variant"]> }> = {
  ready: { label: "Ready", variant: "success" },
  processing: { label: "Processing", variant: "brand" },
  failed: { label: "Failed", variant: "danger" },
  draft: { label: "Draft", variant: "info" },
};

/** Always shows a text label, so status is never conveyed by color alone. */
export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { label, variant } = STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
