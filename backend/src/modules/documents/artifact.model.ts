import { Schema, model } from "mongoose";

/**
 * One stored PDF file. Artifacts are write-once: nothing in the codebase updates them,
 * and the storage layer refuses to overwrite the file behind them.
 */
const artifactSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    kind: { type: String, enum: ["original", "revision"], required: true },
    // Internal only. Never returned by any API response.
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
    sha256: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "v2_artifacts" },
);

export const ArtifactModel = model("Artifact", artifactSchema);