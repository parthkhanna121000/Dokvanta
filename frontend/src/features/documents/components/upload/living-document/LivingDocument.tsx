import { cn } from "@/lib/utils/cn";
import { CheckDraw } from "./CheckDraw";
import { DocumentLayers } from "./DocumentLayers";
import { ScanFrame } from "./ScanFrame";
import "./living-document.css";

/** Deliberately independent of the upload code, so it can be reused elsewhere. */
export type LivingDocumentPhase = "idle" | "uploading" | "processing" | "success" | "error";

interface LivingDocumentProps {
  phase: LivingDocumentPhase;
  /** 0 to 100. Only used while uploading. */
  percent?: number;
  className?: string;
}

/**
 * Purely visual. It is aria-hidden: the status text and live region next to it
 * carry the meaning. The phase is driven from outside; this component never
 * decides on its own that something has finished.
 */
export function LivingDocument({ phase, percent = 0, className }: LivingDocumentProps) {
  return (
    <div className={cn("ld", className)} data-phase={phase} aria-hidden="true">
      <div className="ld-float">
        <DocumentLayers />
        {phase === "uploading" && <ScanFrame percent={percent} />}
        {phase === "success" && (
          <span className="ld-badge" data-kind="success">
            <CheckDraw />
          </span>
        )}
        {phase === "error" && (
          <span className="ld-badge" data-kind="error">
            !
          </span>
        )}
      </div>
    </div>
  );
}
