import { Schema, model } from "mongoose";

export const DOCUMENT_STATUSES = ["uploading", "processing", "ready", "failed"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

const documentSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    originalFilename: { type: String, required: true, maxlength: 255 },
    sizeBytes: { type: Number, required: true, min: 0 },
    status: { type: String, enum: [...DOCUMENT_STATUSES], required: true, default: "processing" },
    failureReason: { type: String },
    originalArtifactId: { type: Schema.Types.ObjectId, ref: "Artifact" },
    currentRevisionId: { type: Schema.Types.ObjectId, ref: "Revision" },
  },
  { timestamps: true, collection: "v2_documents" },
);

documentSchema.index({ ownerId: 1, createdAt: -1 });

export const DocumentModel = model("Document", documentSchema);