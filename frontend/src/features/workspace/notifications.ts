export interface Notification {
  id: string;
  title: string;
  detail: string;
}

/** Sample data. Moves behind a service in the Phase 4B mock layer. No dates, so rendering stays deterministic. */
export const SAMPLE_NOTIFICATIONS: readonly Notification[] = [
  {
    id: "n1",
    title: "Welcome to Dokvanta",
    detail: "Your workspace is ready. This is a prototype: everything here is simulated.",
  },
  {
    id: "n2",
    title: "Sample document ready",
    detail: "Q3 Project Proposal.pdf finished processing (simulated).",
  },
  {
    id: "n3",
    title: "Revision committed",
    detail: "Revision 2 of Q3 Project Proposal.pdf was saved (simulated).",
  },
];
