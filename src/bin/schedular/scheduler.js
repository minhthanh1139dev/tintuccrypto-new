"use strict";

import logger from "../../shared/utils/logger.js";
import MongoDB from "../../infra/mongodb.js";
import cronRegistry from "../../scheduler/registry.js";

// ── Import jobs ──────────────────────────────────────────────────────────────
import fileJob from "../../domain/file/jobs/file.job.js";
import analysisJob from "../../domain/analysis/jobs/analysis.job.js";

let isShuttingDown = false;

const start = async () => {
  try {
    await MongoDB.connect();

    cronRegistry.register(fileJob.cleanupOrphanUploads);
    cronRegistry.register(analysisJob.periodicAnalysis);
    cronRegistry.register(analysisJob.marketAlertCheck);

    logger.info("scheduler worker is running");
  } catch (error) {
    logger.error({ error: error.message }, "failed to start scheduler worker");
    process.exit(1);
  }
};

const shutdown = async () => {
  if (isShuttingDown) {
    logger.warn("shutdown already in progress");
    return;
  }

  isShuttingDown = true;
  logger.info("shutting down scheduler worker");
  try {
    cronRegistry.stopAll();
    await MongoDB.close();
    logger.info("scheduler shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error(
      { error: error.message },
      "failed to shutdown scheduler worker",
    );
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
