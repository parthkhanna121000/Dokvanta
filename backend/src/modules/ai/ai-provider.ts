/** What the AI is allowed to see. selectedText and surroundingText are untrusted document content. */
export interface AiEditInput {
  page: number;
  selectedText: string;
  surroundingText?: string;
  instruction: string;
}

/**
 * A provider returns either raw operations or a question for the user.
 * Raw operations are untrusted: the editing service validates every field with Zod
 * before anything is stored, and the AI never sees or sets ids, paths or owners.
 */
export type AiResult =
  | { kind: "proposal"; operations: unknown[] }
  | { kind: "clarification"; question: string };

export interface AiProvider {
  /** Stored on every session so it is always clear which provider produced a proposal, e.g. "mock". */
  readonly name: string;
  proposeEdits(input: AiEditInput, signal?: AbortSignal): Promise<AiResult>;
}

/** The model answered, but not in the expected format. */
export class AiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiOutputError";
  }
}