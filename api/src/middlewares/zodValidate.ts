import { Request, RequestHandler } from "express";
import { z, ZodTypeAny } from "zod";

type ValidatedRequestData = {
  body?: unknown;
  params?: unknown;
  query?: unknown;
};

export const zodValidate = (schema: ZodTypeAny): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        status: "fail",
        message: "Validation failed",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const validatedData = result.data as ValidatedRequestData;

    if (validatedData.body !== undefined) {
      req.body = validatedData.body;
    }

    if (validatedData.params !== undefined) {
      req.params = validatedData.params as Request["params"];
    }

    if (validatedData.query !== undefined) {
      Object.defineProperty(req, "query", {
        value: validatedData.query as Request["query"],
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };
};

export { z };