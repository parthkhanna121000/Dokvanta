import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/app-error";
import { logger } from "../utils/logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
};

function errorType(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "type" in err) {
    const type = (err as { type: unknown }).type;
    return typeof type === "string" ? type : undefined;
  }
  return undefined;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong";
  let details: unknown;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (errorType(err) === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "Request body is not valid JSON";
  } else if (errorType(err) === "entity.too.large") {
    status = 413;
    code = "PAYLOAD_TOO_LARGE";
    message = "Request body is too large";
  }

  if (status >= 500) {
    logger.error({ err, requestId: req.id }, "Unhandled error");
  }

  res.status(status).json({
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      requestId: req.id,
    },
  });
};
