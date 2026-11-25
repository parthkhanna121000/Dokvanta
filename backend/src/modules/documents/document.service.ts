import { createHash } from "node:crypto";
import { Types } from "mongoose";
import type { FileStorage } from "../../storage/file-storage";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";
import { ArtifactModel } from "./artifact.model";
import { DocumentModel } from "./document.model";
import {
  assertValidPdf,
  deriveTitle,
  sanitizeFilename,
  type UploadedFileLike,
} from "./pdf-validation";
import { RevisionModel } from "./revision.model";

export interface DocumentServiceDeps {
  storage: FileStorage;
}

export interface PublicDocument {
  id: string;
  title: string;
  originalFilename: string;
  sizeBytes: number;
  status: string;
  currentRevisionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentLike {
  _id: Types.ObjectId;
  title: string;
  originalFilename: string;
  sizeBytes: number;
  status: string;
  currentRevisionId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

/** The only shape sent to clients. Storage keys and artifact ids are deliberately absent. */
export function toPublicDocument(doc: DocumentLike): PublicDocument {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    originalFilename: doc.originalFilename,
    sizeBytes: doc.sizeBytes,
    status: doc.status,
    currentRevisionId: doc.currentRevisionId ? doc.currentRevisionId.toHexString() : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Upload flow: validate -> create document (processing) -> write immutable file ->
 * create artifact + revision 1 -> mark document ready.
 * Validation runs first, so rejected uploads leave nothing behind.
 */
export async function createDocumentFromUpload(
  deps: DocumentServiceDeps,
  ownerId: string,
  upload: UploadedFileLike | undefined,
): Promise<PublicDocument> {
  const file = assertValidPdf(upload);
  const filename = sanitizeFilename(file.originalname);

  const owner = new Types.ObjectId(ownerId);
  const documentId = new Types.ObjectId();
  const artifactId = new Types.ObjectId();
  const revisionId = new Types.ObjectId();
  // Every part of the key is backend-generated.
  const storageKey = `${ownerId}/${documentId.toHexString()}/${artifactId.toHexString()}.pdf`;
  const sha256 = createHash("sha256").update(file.buffer).digest("hex");

  await DocumentModel.create({
    _id: documentId,
    ownerId: owner,
    title: deriveTitle(filename),
    originalFilename: filename,
    sizeBytes: file.buffer.length,
    status: "processing",
  });

  try {
    await deps.storage.put(storageKey, file.buffer);
    await ArtifactModel.create({
      _id: artifactId,
      ownerId: owner,
      documentId,
      kind: "original",
      storageKey,
      mimeType: "application/pdf",
      sizeBytes: file.buffer.length,
      sha256,
    });
    await RevisionModel.create({
      _id: revisionId,
      documentId,
      number: 1,
      parentRevisionId: null,
      artifactId,
      sourceSessionId: null,
      createdBy: owner,
    });
    const ready = await DocumentModel.findByIdAndUpdate(
      documentId,
      { status: "ready", originalArtifactId: artifactId, currentRevisionId: revisionId },
      { returnDocument: "after" },
    );
    if (!ready) throw new Error("Document disappeared during upload");
    return toPublicDocument(ready);
  } catch (err) {
    logger.error({ err, documentId: documentId.toHexString() }, "Document upload failed");
    await DocumentModel.updateOne(
      { _id: documentId },
      { status: "failed", failureReason: "Upload processing failed" },
    ).catch(() => undefined);
    throw err;
  }
}

/** Ownership is part of the query. Someone else's document looks exactly like a missing one. */
async function findOwnedDocument(ownerId: string, documentId: string) {
  const doc = await DocumentModel.findOne({
    _id: documentId,
    ownerId: new Types.ObjectId(ownerId),
  });
  if (!doc) throw AppError.notFound("Document not found");
  return doc;
}

export async function getDocument(ownerId: string, documentId: string): Promise<PublicDocument> {
  return toPublicDocument(await findOwnedDocument(ownerId, documentId));
}

export async function listDocuments(ownerId: string, page: number, limit: number) {
  const filter = { ownerId: new Types.ObjectId(ownerId) };
  const [items, total] = await Promise.all([
    DocumentModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    DocumentModel.countDocuments(filter),
  ]);
  return { items: items.map(toPublicDocument), total };
}

export async function readOriginalPdf(
  deps: DocumentServiceDeps,
  ownerId: string,
  documentId: string,
): Promise<{ buffer: Buffer; filename: string }> {
  const doc = await findOwnedDocument(ownerId, documentId);
  if (doc.status !== "ready" || !doc.originalArtifactId) {
    throw AppError.conflict("Document is not ready");
  }
  const artifact = await ArtifactModel.findOne({
    _id: doc.originalArtifactId,
    documentId: doc._id,
    ownerId: doc.ownerId,
  });
  if (!artifact) throw new Error("Original artifact record is missing");
  const buffer = await deps.storage.get(artifact.storageKey);
  return { buffer, filename: doc.originalFilename };
}