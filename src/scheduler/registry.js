"use strict"

import cron from "node-cron";
import logger from "../shared/utils/logger.js";

/**
 * Registry to manage and track cron jobs
 */
class CronJobRegistry {
  constructor() {
    this.jobs = new Map();
    this.runningJobs = new Set();
  }

  validateJob(job) {
    if (!job || typeof job !== "object") {
      throw new Error("Invalid job definition");
    }
    if (!job.name || typeof job.name !== "string") {
      throw new Error("Job name is required and must be a string");
    }
    if (!job.schedule || typeof job.schedule !== "string") {
      throw new Error(`Job schedule is required for ${job.name}`);
    }
    if (typeof job.action !== "function") {
      throw new Error(`Job action must be a function for ${job.name}`);
    }
  }

  async executeJob(job, trigger = "cron") {
    if (this.runningJobs.has(job.name)) {
      logger.warn({ job: job.name, trigger }, "job skipped because previous run is still in progress");
      return;
    }

    const start = Date.now();
    this.runningJobs.add(job.name);
    try {
      await job.action();
      logger.info({ job: job.name, trigger, ms: Date.now() - start }, "job done");
    } catch (error) {
      logger.error({ job: job.name, trigger, error: error.message }, "job failed");
    } finally {
      this.runningJobs.delete(job.name);
    }
  }

  /**
   * Register a new cron job
   * @param {Object} job - Job definition
   * @param {string} job.name - Unique name for the job
   * @param {string} job.schedule - Cron schedule string
   * @param {Function} job.action - Async function to execute
   * @param {boolean} [job.runOnInit] - Whether to run the job once immediately
   */
  register(job) {
    this.validateJob(job);

    if (this.jobs.has(job.name)) {
      throw new Error(`Job already registered: ${job.name}`);
    }

    const task = cron.schedule(job.schedule, async () => this.executeJob(job, "cron"));

    this.jobs.set(job.name, task);
    logger.info({ job: job.name, schedule: job.schedule }, "registered");

    if (job.runOnInit) {
      logger.info({ job: job.name }, "running initial execution");
      Promise.resolve(this.executeJob(job, "init"));
    }
  }

  /**
   * Stop all registered jobs
   */
  stopAll() {
    for (const [name, task] of this.jobs) {
      task.stop();
      task.destroy?.();
      logger.info(`Stopped cron job: ${name}`);
    }
    this.runningJobs.clear();
    this.jobs.clear();
  }
}

export default new CronJobRegistry();
