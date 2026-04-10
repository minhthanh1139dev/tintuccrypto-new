---
description: Step-by-step workflow for scaffolding a new module (e.g., Product, Category, Order)
---

// turbo-all

# Create New Module

This workflow creates a complete module following the project's layered architecture.
Replace `X` / `x` with the module name (e.g., `Product` / `product`).

**Dependency flow (NEVER violate):**
```
Router → Controller → Service → Repository → Model
```

---

## Steps

### 1. Create Model — `src/models/x.model.js`

Define the Mongoose schema:

```js
"use strict"

import mongoose from "mongoose";

const XSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // add fields...
  },
  {
    timestamps: true,
    collection: "xs",   // explicit collection name, always lowercase plural
  },
);

// Indexes based on anticipated query patterns
XSchema.index({ name: 1 });

export default mongoose.model("X", XSchema);
```

**Rules:**
- Always `timestamps: true` and explicit `collection` name
- `enum` must list ALL values used anywhere in the codebase
- Indexes based on actual query patterns in Repository
- Sensitive fields (e.g., password) — do NOT use `select: false`; strip in Service layer instead

---

### 2. Create Repository — `src/domain/x/repositories/x.repository.js`

```js
"use strict"

import X from "../../../models/x.model.js";
import { paginateQuery } from "../../../shared/utils/pagination.js";

class XRepository {
  async create(data) {
    return await X.create(data);
  }

  async findById(id) {
    return await X.findById(id);
  }

  async findAll({ filters, sort = { createdAt: -1 }, paginator } = {}) {
    return await paginateQuery(X, { filters, sort, paginator });
  }

  async update(id, data) {
    return await X.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await X.findByIdAndDelete(id);
  }
}

export default new XRepository();
```

**Rules:**
- Only layer allowed to import Model
- Return raw Mongoose documents — do NOT throw errors here
- Use `paginateQuery()` for list queries with filter/sort/paginate

---

### 3. Create Service — `src/domain/x/services/x.service.js`

```js
"use strict"

import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";
import { X_CODES } from "../constants/x.codes.js";
import xRepository from "../repositories/x.repository.js";

class XService {
  async getById(id) {
    const doc = await xRepository.findById(id);
    if (!doc) throw new AppError(X_CODES.X_NOT_FOUND, 404);
    return doc;
  }

  async getAll({ paginator }) {
    return await xRepository.findAll({ paginator });
  }

  async create(data) {
    // business validation example
    const existing = await xRepository.findByName(data.name);
    if (existing) throw new AppError(X_CODES.X_ALREADY_EXISTS, 409);

    return await xRepository.create(data);
  }

  async update(id, data) {
    const doc = await xRepository.findById(id);
    if (!doc) throw new AppError(X_CODES.X_NOT_FOUND, 404);

    return await xRepository.update(id, data);
  }

  async delete(id) {
    const doc = await xRepository.findById(id);
    if (!doc) throw new AppError(X_CODES.X_NOT_FOUND, 404);

    return await xRepository.delete(id);
  }
}

export default new XService();
```

**Rules:**
- Import Repository only — NEVER import Model directly
- Throw `AppError` subclasses with domain-specific codes for ALL failure cases — NEVER return `null`/`false`
- Strip sensitive fields before returning: `.toObject()` + `delete`
- `try...catch` allowed ONLY for wrapping external library errors (JWT, bcrypt)

---

### 4. Create Controller — `src/domain/x/controllers/x.controller.js`

```js
"use strict"

import xService from "../services/x.service.js";
import response from "../../../shared/utils/response.js";
import { X_CODES } from "../constants/x.codes.js";

class XController {
  async getById(req, res) {
    const result = await xService.getById(req.params.id);
    return response.success(res, result, 200, "Retrieved successfully", X_CODES.SUCCESS);
  }

  async getAll(req, res) {
    const { page, limit } = req.query;
    const { items, total, page: currentPage, limit: currentLimit } = await xService.getAll({ paginator: { page, limit } });
    return response.paginate(res, items, total, currentPage, currentLimit, X_CODES.SUCCESS);
  }

  async create(req, res) {
    const result = await xService.create(req.body);
    return response.success(res, result, 201, "Created successfully", X_CODES.SUCCESS);
  }

  async update(req, res) {
    const result = await xService.update(req.params.id, req.body);
    return response.success(res, result, 200, "Updated successfully", X_CODES.SUCCESS);
  }

  async delete(req, res) {
    await xService.delete(req.params.id);
    return response.success(res, null, 200, "Deleted successfully", X_CODES.SUCCESS);
  }
}

export default new XController();
```

**Rules:**
- Import Service only — NEVER import Repository or Model
- NO `try...catch` — errors propagate via `asyncHandler` → `errorHandler`
- NO business logic — only extract req data, call Service, send response
- Response MUST use `response.success()` or `response.paginate()`, never `res.status().json()`

---

### 5. Create Validation — `src/domain/x/validations/x.validation.js`

```js
"use strict"

import Joi from "joi";

const create = {
  body: Joi.object({
    name: Joi.string().required(),
    status: Joi.string().valid("active", "inactive").optional(),
  }),
};

const update = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(), // MongoDB ObjectId
  }),
  body: Joi.object({
    name: Joi.string().optional(),
    status: Joi.string().valid("active", "inactive").optional(),
  }),
};

const getById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

export default { create, update, getById };
```

---

### 6. Create Route — `src/domain/x/routes/x.route.js`

```js
"use strict"

import express from "express";
import asyncHandler from "express-async-handler";
import xController from "../controllers/x.controller.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import xValidation from "../validations/x.validation.js";
import { verifyToken } from "../../../shared/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", asyncHandler(xController.getAll));
router.get("/:id", validate(xValidation.getById), asyncHandler(xController.getById));
router.post("/", verifyToken, validate(xValidation.create), asyncHandler(xController.create));
router.patch("/:id", verifyToken, validate(xValidation.update), asyncHandler(xController.update));
router.delete("/:id", verifyToken, asyncHandler(xController.delete));

export default router;
```

**Middleware chain order:** `[Auth] → [Rate Limit] → [Validate] → [Upload] → asyncHandler(controller.method)`

---

### 7. Register Route — `src/routes/index.js`

```js
import xRoutes from "../domain/x/routes/x.route.js";
router.use("/x", xRoutes);
```

---

### 8. Verify

- [ ] Import flow: Router → Controller → Service → Repository → Model (no violations)
- [ ] `"use strict"` on line 1 of every new file
- [ ] No `console.log` — use `logger`
- [ ] No `res.status().json()` — use `response.success()` or `response.paginate()`
- [ ] No `try...catch` in Controller
- [ ] All async handlers wrapped with `asyncHandler()`
- [ ] Joi enum values match Model enum values exactly
- [ ] Route registered in `src/routes/index.js`
- [ ] Run `security-review` workflow after scaffold is complete
