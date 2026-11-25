import type { RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../../utils/app-error";

/**
 * Parses one multipart "file" field into memory, enforcing the size limit while streaming.
 * Multer errors become AppErrors so clients get the standard error envelope.
 */
export function uploadPdf(maxBytes: number): RequestHandler {
  const parse = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 1, fields: 5, parts: 10 },
  }).single("file");

  return (req, res, next) => {
    parse(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          const mb = Math.max(1, Math.floor(maxBytes / (1024 * 1024)));
          next(new AppError(413, "FILE_TOO_LARGE", `File exceeds the ${mb} MB upload limit`));
          return;
        }
        next(AppError.badRequest(`Upload rejected (${err.code})`));
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  };
}