const LINE_WIDTHS = ["w-full", "w-full", "w-5/6", "w-full", "w-2/3"];

/**
 * Three stacked sheets. The back two stay hidden until the processing and
 * success phases animate them (see living-document.css).
 */
export function DocumentLayers() {
  return (
    <>
      <div className="ld-sheet" data-layer="back" />
      <div className="ld-sheet" data-layer="mid" />
      <div className="ld-sheet flex flex-col gap-2 p-3.5" data-layer="front">
        <span className="font-mono text-[0.625rem] leading-none tracking-wider text-muted-foreground">
          PDF
        </span>
        <span className="mt-1 block h-1.5 w-3/5 rounded-sm bg-foreground/80" />
        {LINE_WIDTHS.map((width, i) => (
          <span key={i} className={`block h-1 rounded-sm bg-foreground/15 ${width}`} />
        ))}
      </div>
    </>
  );
}
