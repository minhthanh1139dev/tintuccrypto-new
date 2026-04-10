"use strict";

import { AppError } from "./errorHandler.middleware.js";
import joi from "joi";

export const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      const isJoiSchema = schemas && typeof schemas.validate === "function";
      const bodySchema = schemas?.body || (isJoiSchema ? schemas : undefined);
      const paramsSchema = schemas?.params;
      const querySchema = schemas?.query;

      const compile = (s) => {
        if (!s) return null;
        return typeof s.validateAsync === "function" ? s : joi.compile(s);
      };

      const validateAsync = async (schema, value, options = {}) => {
        const compiled = compile(schema);
        if (!compiled) return value;
        return compiled.validateAsync(value, options);
      };

      if (bodySchema) {
        req.body = await validateAsync(bodySchema, req.body, { abortEarly: false, stripUnknown: true });
      }

      if (paramsSchema) {
        req.params = await validateAsync(paramsSchema, req.params, { abortEarly: false, stripUnknown: true });
      }

      if (querySchema) {
        req.query = await validateAsync(querySchema, req.query, { abortEarly: false, stripUnknown: true });
      }

      next();
    } catch (error) {
      if (error && (error.isJoi || error.name === "ValidationError")) {
        return next(new AppError(error.message || "Validation error", 400, "VALIDATION_ERROR"));
      }
      next(error);
    }
  };
};
