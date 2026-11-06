export interface Pillar {
  id: string;
  number: string;
  name: string;
  summary: string;
  points: readonly string[];
}

/** Landing-page copy lives here so components stay presentational. */
export const PILLARS: readonly Pillar[] = [
  {
    id: "intelligence",
    number: "01",
    name: "AI Document Intelligence",
    summary:
      "Read a document and ask it questions. Answers point back to the pages they came from, so you can check them against the source.",
    points: [
      "Summaries, explanations and key points",
      "Source references with page numbers",
      "Conversation history for every document",
    ],
  },
  {
    id: "visual-edit",
    number: "02",
    name: "AI Visual Edit",
    summary:
      "Describe a change in plain language. Dokvanta proposes structured edits and you review each one before anything becomes part of a revision.",
    points: [
      "Accept or reject changes one by one, or all at once",
      "The original document is never overwritten",
      "Revision history with restore",
    ],
  },
  {
    id: "creator",
    number: "03",
    name: "Document Creator",
    summary:
      "Start from a prompt, a template or plain text. Format it in a clean editor, preview the pages, and export a PDF.",
    points: [
      "Prompt-to-document and a template gallery",
      "Rich-text editor with tables and lists",
      "Plain text to formatted PDF preview",
    ],
  },
] as const;
