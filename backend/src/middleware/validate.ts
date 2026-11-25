import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error";

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Validates request parts with Zod. Parsed body replaces req.body.
 * Express 5 makes req.query read-only, so parsed query/params go to
 * res.locals.query / res.locals.params.
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    const issues: { in: string; path: string; message: string }[] = [];

    for (const part of ["body", "query", "params"] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({
            in: part,
            path: issue.path.map(String).join("."),
            message: issue.message,
          });
        }
      } else if (part === "body") {
        req.body = result.data;
      } else {
        res.locals[part] = result.data;
      }
    }

    if (issues.length > 0) {
      next(AppError.badRequest("Validation failed", issues));
      return;
    }
    next();
  };
}
