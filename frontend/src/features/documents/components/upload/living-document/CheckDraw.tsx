/** A checkmark that draws itself. pathLength={1} normalises the stroke for the CSS dash animation. */
export function CheckDraw() {
  return (
    <svg
      className="ld-check"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} />
    </svg>
  );
}
