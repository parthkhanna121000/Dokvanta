import type { CSSProperties } from "react";

/**
 * Corner brackets, a sweeping scan line, and a hairline progress track whose
 * fill is the real upload percentage.
 */
export function ScanFrame({ percent }: { percent: number }) {
  const progress = Math.min(100, Math.max(0, percent)) / 100;

  return (
    <>
      <div className="ld-frame">
        <span className="ld-corner" data-corner="tl" />
        <span className="ld-corner" data-corner="tr" />
        <span className="ld-corner" data-corner="bl" />
        <span className="ld-corner" data-corner="br" />
      </div>
      <span className="ld-scan" />
      <div className="ld-track">
        <span style={{ "--ld-progress": progress } as CSSProperties} />
      </div>
    </>
  );
}
