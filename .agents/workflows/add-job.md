---
description: Workflow for creating a new cron job and registering it in the scheduler
---

// turbo-all

# Add a New Cron Job

This workflow creates a new scheduled job following the project's job architecture.

## Architecture Overview

```
src/domain/x/jobs/x.job.js          →  Job definition (calls Service)
src/scheduler/registry.js  →  CronJobRegistry singleton (register + stopAll)
src/bin/schedular/schedular.js  →  Import job, call cronRegistry.register()
```

## Steps

### 1. Decide Where the Job Belongs

- **Existing job class?** → Add a new property to the existing `*.job.js` file
- **New domain?** → Create a new `src/domain/x/jobs/x.job.js` file

### 2. Create / Update Job File — `src/domain/x/jobs/x.job.js`

Each job is a **property** on a job class with the shape `{ name, schedule, action }`:

```js
"use strict"

import xService from "../services/x.service.js";
import logger from "../../../shared/utils/logger.js";

class XJob {
  jobName = {
    name: "Human Readable Name",
    schedule: "0 3 * * *",        // cron expression (node-cron format)
    action: async () => {
      try {
        await xService.someMethod();
        logger.info("[JobName] Completed successfully");
      } catch (err) {
        // NEVER re-throw — a failed job must NOT crash the scheduler
        logger.error({ err }, "[JobName] Failed");
      }
    },
  };
}

export default new XJob();
```

**Rules:**
- Job `action` calls **Service methods only** — NEVER import Repository or Model directly
- Job `action` MUST have a `try...catch` — failed job must not crash the scheduler
- NEVER re-throw errors inside `action` — catch, log, and return
- Job `name` must be unique across all jobs
- Use descriptive names: `"Upload Cleanup"`, not `"job1"`
- One class can have multiple related job properties
- Export as singleton: `export default new XJob()`

### 3. Implement Service Method (if not exists) — `src/domain/x/services/x.service.js`

- The actual business logic lives in the Service layer
- Use `logger` for progress/error logging inside the action
- Service method CAN throw — the job's `try...catch` will handle it

```js
// ✅ Service method for a job — can throw normally
async cleanupExpiredUploads() {
  const deleted = await uploadRepository.deleteExpiredBefore(new Date());
  logger.info({ count: deleted }, "Cleanup completed");
}
```

### 4. Register in Scheduler — `src/bin/schedular/schedular.js`

Add two lines:

```js
// ── Import jobs ──────────────────────────────────────────────────────────────
import xJob from "../../domain/x/jobs/x.job.js";

// Inside start():
cronRegistry.register(xJob.jobName);
```

### 5. Common Cron Schedules Reference

| Schedule | Expression |
|---|---|
| Every minute | `* * * * *` |
| Every 5 minutes | `*/5 * * * *` |
| Every hour | `0 * * * *` |
| Every day at 3 AM | `0 3 * * *` |
| Every Monday at 9 AM | `0 9 * * 1` |
| Every 1st of month | `0 0 1 * *` |

### 6. Verify

- [ ] Job property has `{ name, schedule, action }` shape
- [ ] `action` has `try...catch` — scheduler must not crash on failure
- [ ] `action` does NOT re-throw errors
- [ ] `action` only calls Service methods
- [ ] Job `name` is unique
- [ ] Job is registered in `schedular.js` via `cronRegistry.register()`
- [ ] `"use strict"` on line 1
- [ ] No `console.log` — use `logger`
