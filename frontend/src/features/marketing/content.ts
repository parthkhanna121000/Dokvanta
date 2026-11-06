export interface Pillar {
  id: string;
  number: string;
  name: string;
  summary: string;
  points: readonly string[];
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface UseCase {
  audience: string;
  description: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
  highlighted?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
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

export const STEPS: readonly Step[] = [
  {
    number: "1",
    title: "Upload or create",
    description: "Bring in a PDF, or start a new document from a prompt, a template or plain text.",
  },
  {
    number: "2",
    title: "Understand",
    description: "Ask questions and get answers with page references you can click to verify.",
  },
  {
    number: "3",
    title: "Edit",
    description: "Describe a change, review each proposed edit, and commit a new revision.",
  },
  {
    number: "4",
    title: "Export",
    description: "Preview the pages and export a clean PDF when the document is ready.",
  },
] as const;

export const USE_CASES: readonly UseCase[] = [
  {
    audience: "Students",
    description: "Make sense of dense readings and pull key points out of long chapters.",
  },
  {
    audience: "Professionals",
    description: "Review contracts and reports faster, and draft polished documents from a template.",
  },
  {
    audience: "Researchers",
    description: "Find where a claim appears in a paper and keep track of the pages that support it.",
  },
  {
    audience: "Developers",
    description: "Get through specs and technical documentation, and produce clear written deliverables.",
  },
  {
    audience: "Everyday users",
    description: "Understand forms, letters and manuals, then create simple documents without fuss.",
  },
] as const;

/** Illustrative only. No payment processing exists in this prototype. */
export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "per month",
    description: "For trying Dokvanta on occasional documents.",
    features: ["Limited documents", "Document Intelligence", "Basic templates"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "For people who work with documents every day.",
    features: [
      "Larger document limits",
      "AI Visual Edit with revision history",
      "Full template gallery",
      "PDF export",
    ],
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$29",
    period: "per user, per month",
    description: "For teams that share and review documents together.",
    features: ["Everything in Pro", "Shared workspaces", "Priority support"],
  },
] as const;

export const FAQS: readonly FaqItem[] = [
  {
    question: "Is this a working product?",
    answer:
      "Dokvanta V1 is a frontend prototype. The interface is real, but AI responses, documents and sign-in are simulated. No document is sent to an AI model or stored on a server.",
  },
  {
    question: "Are the prices real?",
    answer:
      "No. The plans and prices on this page are illustrative. There is no checkout and no payment is taken.",
  },
  {
    question: "Does Dokvanta overwrite my original document?",
    answer:
      "Never. Edits are proposed against a temporary copy. You review each change, and only a committed revision becomes part of the history. The original always stays available.",
  },
  {
    question: "How do citations work?",
    answer:
      "Answers include page references. Clicking one jumps the viewer to that page. In this prototype the citations come from sample data and have not been verified by a real model.",
  },
  {
    question: "Which file types are supported?",
    answer:
      "Dokvanta is PDF-first. The prototype accepts PDF uploads, validates their type and size in the browser, and keeps them only for the current session.",
  },
  {
    question: "Can I export what I create?",
    answer:
      "Yes. Documents made in the Creator can be previewed and exported to PDF from the browser using the print dialog.",
  },
] as const;
