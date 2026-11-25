import { Schema, model } from "mongoose";

const revisionSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true },
    number: { type: Number, required: true, min: 1 },
    parentRevisionId: { type: Schema.Types.ObjectId, ref: "Revision", default: null },
    artifactId: { type: Schema.Types.ObjectId, ref: "Artifact", required: true },
    // Filled in Milestone 5 when a revision is produced by an editing session.
    sourceSessionId: { type: Schema.Types.ObjectId, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "v2_revisions" },
);

// A document can never have two revisions with the same number.
revisionSchema.index({ documentId: 1, number: 1 }, { unique: true });

export const RevisionModel = model("Revision", revisionSchema);