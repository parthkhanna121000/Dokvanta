import type { RequestHandler } from "express";
import { logger } from "../utils/logger";

/**
 * Logs one structured line per finished request.
 * Never logs headers, bodies, or query strings (they can contain tokens).
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  const path = req.originalUrl.split("?")[0];

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info(
      {
        requestId: req.id,
        method: req.method,
        path,
        status: res.statusCode,
        durationMs: Math.round(durationMs),
      },
      "request completed",
    );
  });

  next();
};