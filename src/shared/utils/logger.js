"use strict"

import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: null, // Bỏ qua pid và hostname
  serializers: {
    err: (err) => {
      const status = err.statusCode || err.status || 500;
      const isInternalError = status >= 500;
      return {
        type: err.type || err.name,
        message: err.message,
        stack: isInternalError ? err.stack : undefined,
        statusCode: status,
        errorCode: err.errorCode,
        details: err.details,
      };
    },
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: ["password", "token", "authorization", "*.password", "*.token", "req.headers.authorization"],
    remove: true,
  },
});

export default logger;

