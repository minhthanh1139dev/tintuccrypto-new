---
name: base-backend-conventions
description: Project conventions, architecture rules, and layer-specific guidelines for the base-backend Node.js boilerplate.
---

# Base Backend Node.js — Agent Rules

## 1. Project Overview

- **Runtime:** Node.js with ES Modules (`import`/`export`). NEVER use CommonJS (`require`/`module.exports`).
- **Framework:** Express 5
- **Database:** MongoDB via Mongoose 9
- **Validation:** Joi
- **Logging:** Pino (`src/utils/logger.js`)
- **Auth:** JWT (access + refresh tokens) with bcrypt password hashing

---

## 2. Architecture — Layered Dependencies (STRICT)

The project follows a strict one-directional dependency flow. **NEVER violate this.**

```
Router → Controller → Service → Repository → Model
```

### What each layer CAN import:

| Layer | Can Import |
|---|---|
| **Model** | `mongoose` only |
| **Repository** | Its own Model, `utils/queryOptions.js` |
| **Service** | Its own Repository(ies), `utils/*` |
| **Controller** | Its own Service(s), `utils/response.js` only |
| **Router** | Controller, Middlewares, Validation schemas, `express`, `express-async-handler` |
| **Middleware** | `utils/*`, `config/*` — NEVER import Controller/Service/Repository/Model |
| **Utils** | `config/config.js` only (or nothing). Utils are stateless. |
| **Infra** | `mongoose`, `config/config.js`, `utils/logger.js` |
| **Jobs** | Service(s), `utils/logger.js` |

### What is FORBIDDEN:

- ❌ Controller importing Model or Repository
- ❌ Service importing Model directly (must go through Repository)
- ❌ Repository importing Service or Controller
- ❌ Middleware importing Controller, Service, Repository, or Model
- ❌ Any circular dependencies

---

## 3. Coding Conventions

### 3.1 File Structure
- Every file starts with `"use strict"` on line 1
- ES Modules: `import`/`export` everywhere
- File naming: `kebab-case` with type suffix — `user.controller.js`, `auth.middleware.js`, `file.model.js`
- One class per file, export as singleton instance:
  ```js
  class UserService { ... }
  export default new UserService();
  ```

### 3.2 Response Handling
- **ALWAYS** use custom response classes from `src/utils/response.js`:
  - Success: `new OK({ message, data }).send(res)`, `new CREATED({ message, data }).send(res)`
  - Error: `throw new BAD_REQUEST({ message })`, `throw new NOT_FOUND({ message })`, etc.
- **NEVER** use `res.status(xxx).json(...)` directly
- Available error classes: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UNPROCESSABLE_ENTITY`, `TOO_MANY_REQUESTS`, `INTERNAL_SERVER_ERROR`

### 3.3 Error Handling
- **NO `try...catch`** in Controllers — errors propagate to `asyncHandler` → `errorHandler` middleware
- `try...catch` is acceptable ONLY in Services when you need to transform external errors (e.g., JWT verify, bcrypt)
- All business errors **MUST** be thrown as `ErrorResponse` subclasses, never return `null`/`false` to indicate failure

### 3.4 Async I/O
- **ALWAYS** use `fs.promises.*` for file operations. NEVER use sync variants (`readFileSync`, `writeFileSync`, etc.)
- **ALWAYS** use `async/await`, never raw Promises with `.then()/.catch()` chains

### 3.5 Logging
- **ALWAYS** use `logger` from `src/utils/logger.js` (Pino)
- **NEVER** use `console.log`, `console.error`, etc. (exception: `bin/` entrypoints before logger is available)
- Use structured logging: `logger.info({ key: value }, "message")`

---

## 4. Layer-Specific Rules

### 4.1 Models (`src/models/`)

**Purpose:** Define Mongoose schemas and export compiled models.

**Rules:**
- Always include `timestamps: true` and explicit `collection` name in schema options
- Use `enum` with explicit arrays for fields with limited values
- Define indexes AFTER schema creation using `Schema.index(...)`, based on actual query patterns from Repositories
- **Before adding/removing a field:** Assess impact on all Repositories that query this model, all Services that consume the data, and all Controllers that return the data
- Use `trim: true` on String fields where appropriate
- Sensitive fields (like `password`) should NOT have `select: false` — instead, strip them in the Service layer using `.toObject()` + `delete`

**Template:**
```js
"use strict"

import mongoose from "mongoose";

const XSchema = new mongoose.Schema(
  {
    // fields...
  },
  {
    timestamps: true,
    collection: "xs",
  },
);

// Indexes based on query patterns
XSchema.index({ fieldA: 1 });

const X = mongoose.model("X", XSchema);

export default X;
```

### 4.2 Repositories (`src/repositories/`)

**Purpose:** Sole data access layer. The ONLY place that imports and queries Mongoose Models.

**Rules:**
- For complex queries (filter + sort + paginate), **MUST** use `buildFindQueryOptions()` from `utils/queryOptions.js`
- Methods should return raw Mongoose documents or arrays — do NOT throw errors here, let Service handle that
- Consider N+1 query problems: if you need related data, design batch query methods (e.g., `findByIds()`) instead of looping `findById()`
- When using `.populate()`, be explicit about fields to select to avoid over-fetching
- For `.select()`, choose projection wisely — avoid returning more data than needed

**Template:**
```js
"use strict"

import X from "../models/x.model.js";
import buildFindQueryOptions from "../utils/queryOptions.js";

class XRepository {
  async create(data) {
    return await X.create(data);
  }

  async findById(id) {
    return await X.findById(id);
  }

  async findAll({ filters, sort = { createdAt: -1 }, paginator } = {}) {
    return await X.find(
      ...buildFindQueryOptions({ filters, sort, paginator })
    );
  }

  async delete(id) {
    return await X.findByIdAndDelete(id);
  }
}

export default new XRepository();
```

### 4.3 Services (`src/services/`)

**Purpose:** Core business logic. Orchestrates data flow between Repositories and applies business rules.

**Rules:**
- Import Repository(ies), NEVER import Models directly
- All business validation and error throwing happens here using custom ErrorResponse classes
- **I/O awareness:** Always use async I/O (`fs.promises`). Be aware of potential blocking operations
- **N+1 prevention:** When processing lists, prefer batch Repository calls over loops
- **Sensitive data:** Strip sensitive fields (e.g., `password`) before returning to Controller using `.toObject()` + `delete`
- `try...catch` is allowed here ONLY for wrapping external library errors (JWT, bcrypt, etc.) into custom ErrorResponse

**Template:**
```js
"use strict"

import { BAD_REQUEST, NOT_FOUND } from "../utils/response.js";
import xRepository from "../repositories/x.repository.js";

class XService {
  async getById(id) {
    const doc = await xRepository.findById(id);
    if (!doc) {
      throw new NOT_FOUND({ message: "X not found" });
    }
    return doc;
  }

  async create(data) {
    // business validation...
    return await xRepository.create(data);
  }
}

export default new XService();
```

### 4.4 Controllers (`src/controllers/`)

**Purpose:** Thin request/response adapter. Extracts data from `req`, calls Service, sends response via `res`.

**Rules:**
- Import Service(s) only. NEVER import Repository or Model
- **NO `try...catch`** — let errors propagate to asyncHandler/errorHandler
- **NO business logic** — no DB queries, no file processing, no data transformation beyond simple mapping
- Response MUST use custom classes: `new OK({...}).send(res)`, `new CREATED({...}).send(res)`
- When using class methods as route handlers, **bind `this` context** if needed: `controller.method.bind(controller)`

**Template:**
```js
"use strict"

import xService from "../services/x.service.js";
import { OK, CREATED } from "../utils/response.js";

class XController {
  async getById(req, res) {
    const result = await xService.getById(req.params.id);

    new OK({
      message: "Retrieved successfully",
      data: result,
    }).send(res);
  }

  async create(req, res) {
    const result = await xService.create(req.body);

    new CREATED({
      message: "Created successfully",
      data: result,
    }).send(res);
  }
}

export default new XController();
```

### 4.5 Routes (`src/routes/`)

**Purpose:** Define HTTP endpoints, compose middleware chains, and map to Controller methods.

**Rules:**
- Every controller method **MUST** be wrapped with `asyncHandler()` from `express-async-handler`
- Middleware chain ordering: `[Auth] → [Rate Limit] → [Validate] → [Upload] → asyncHandler(controller.method)`
- Validation schemas must be defined in `src/validations/`, NEVER inline
- Always register new routes in `src/routes/index.js`
- Use descriptive route grouping with comments

**Template:**
```js
"use strict"

import express from "express";
import asyncHandler from "express-async-handler";
import xController from "../controllers/x.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import xValidation from "../validations/x.validation.js";

const router = express.Router();

router.get("/", asyncHandler(xController.getAll));
router.get("/:id", asyncHandler(xController.getById));
router.post(
  "/",
  validate(xValidation.create),
  asyncHandler(xController.create),
);

export default router;
```

### 4.6 Validations (`src/validations/`)

**Purpose:** Joi schemas for request validation.

**Rules:**
- Export default object with named schemas: `{ create, update, getById }`
- Use `{ body, params, query }` structure for schemas that validate multiple parts of the request
- Always use `.required()` for mandatory fields, `.optional()` for optional
- Use `stripUnknown: true` (handled by validate middleware)

### 4.7 Middlewares (`src/middlewares/`)

**Purpose:** Cross-cutting concerns (auth, validation, rate limiting, upload, error handling).

**Rules:**
- NEVER contain business logic
- Errors go through `next(new ErrorResponse(...))` — do NOT call `res.json()` directly (except validate middleware for Joi errors)
- Use Factory pattern for configurable middlewares (see `rateLimit.middleware.js`, `upload.middleware.js`)
- File naming: `purpose.middleware.js`

### 4.8 Infrastructure (`src/infra/`)

**Purpose:** External service connection management (DB, cache, etc.)

**Rules:**
- Singleton class pattern with `connect()` + `close()` methods
- Called ONLY from `src/bin/` entrypoints
- NEVER contains business logic
- When adding new infra (e.g., Redis), follow the same pattern as `mongodb.js`

### 4.9 Config vs Constants

- `src/config/config.js` → Values that **change per environment** (read from `.env`)
- `src/constants/app.constants.js` → Values **fixed by application logic** (hardcoded)

### 4.10 Jobs (`src/jobs/`)

**Purpose:** Define scheduled tasks with `{ name, schedule, action }` interface.

**Rules:**
- Jobs call Service methods, NEVER Repository/Model directly
- Each job class groups related jobs, export as singleton
- Cron schedule format: `node-cron` compatible

---

## 5. Security Checklist (When Adding New Features)

- [ ] Validate ALL user input (Joi schemas in `validations/`)
- [ ] Apply appropriate auth middleware (`verifyToken`, `verifyAdmin`, `verifyUser`)
- [ ] Apply rate limiting for public/sensitive endpoints
- [ ] Never expose sensitive data (passwords, tokens, internal IDs) in responses
- [ ] Use parameterized queries (Mongoose handles this by default)
- [ ] Sanitize file uploads (check MIME types, block dangerous extensions)
- [ ] Use `helmet` headers (already configured in `app.js`)

---

## 6. Common Pitfalls to Avoid

1. **Importing Model in Controller/Service** — Always go through Repository
2. **Using `res.status().json()`** — Use custom response classes
3. **Using `console.log`** — Use `logger` from utils
4. **Sync file I/O** — Always use `fs.promises`
5. **Missing `asyncHandler`** — Every async route handler must be wrapped
6. **Forgetting `"use strict"`** — Must be on line 1 of every file
7. **Adding fields without updating enum** — Model enum must match all possible values used in Service logic
8. **Missing indexes** — Every frequently-queried field pattern should have an index
