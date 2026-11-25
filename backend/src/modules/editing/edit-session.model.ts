import { Schema, model } from "mongoose";
import { SESSION_STATUSES } from "./session-state";

export const rectSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false },
);

const editSessionSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    // Set by the backend from the document's current revision. Never taken from the client or the AI.
    baseRevisionId: { type: Schema.Types.ObjectId, ref: "Revision", required: true },
    status: { type: String, enum: [...SESSION_STATUSES], required: true, default: "processing" },
    selection: {
      page: { type: Number, required: true, min: 1 },
      text: { type: String, required: true },
      surroundingText: { type: String },
      rects: { type: [rectSchema], default: [] },
    },
    instruction: { type: String, required: true },
    aiProvider: { type: String },
    failureCode: { type: String },
    failureMessage: { type: String },
  },
  { timestamps: true, collection: "v2_edit_sessions" },
);

editSessionSchema.index({ ownerId: 1, documentId: 1, createdAt: -1 });

export const EditSessionModel = model("EditSession", editSessionSchema);