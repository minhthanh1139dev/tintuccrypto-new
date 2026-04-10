"use strict";

import http from "http";
import app from "../../app.js";
import logger from "../../shared/utils/logger.js";
import MongoDB from "../../infra/mongodb.js";
import config from "../../config/app.config.js";

const port = normalizePort(config.app.port || "3000");
app.set("port", port);

const server = http.createServer(app);

const startServer = async () => {
  try {
    await MongoDB.connect();
    server.listen(port);
    server.on("error", onError);
    server.on("listening", onListening);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

function normalizePort(val) {
  const normalizedPort = parseInt(val, 10);

  if (isNaN(normalizedPort)) {
    return val;
  }

  if (normalizedPort >= 0) {
    return normalizedPort;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Listening on ${bind}`);
}

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    logger.info("HTTP server closed");
    await MongoDB.close();
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  server.close(async () => {
    logger.info("HTTP server closed");
    await MongoDB.close();
  });
});
