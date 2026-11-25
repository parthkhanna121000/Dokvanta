import { Schema, model } from "mongoose";
import { rectSchema } from "./edit-session.model";
import { HIGHLIGHT_COLORS, OPERATION_TYPES } from "./operation.schemas";

export const DECISIONS = ["proposed", "accepted", "rejected"] as const;
export type Decision = (typeof DECISIONS)[number];
export const APPLICATION_STATUSES = ["pending", "applied", "failed"] as const;

const issueSchema = new Schema(
  {
    code: { type: String, required: true },
    message: { type: String, required: true },
  },
  { _id: false },
);

const editOperationSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "EditSession", required: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Number, required: true, min: 0 },
    type: { type: String, enum: [...OPERATION_TYPES], required: true },
    page: { type: Number, required: true, min: 1 },
    targetText: { type: String, required: true },
    position: { type: String, enum: ["before", "after"] },
    originalText: { type: String },
    proposedText: { type: String },
    color: { type: String, enum: [...HIGHLIGHT_COLORS] },
    rects: { type: [rectSchema], default: [] },
    explanation: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    ambiguity: { type: String, default: null },
    validationErrors: { type: [issueSchema], default: [] },
    decision: { type: String, enum: [...DECISIONS], required: true, default: "proposed" },
    // Only the commit step (Milestone 5) will ever change this.
    applicationStatus: { type: String, enum: [...APPLICATION_STATUSES], required: true, default: "pending" },
  },
  { timestamps: true, collection: "v2_edit_operations" },
);

editOperationSchema.index({ sessionId: 1, order: 1 });

export const EditOperationModel = model("EditOperation", editOperationSchema);