---
description: Workflow for editing, developing, and extending a module with strict layer separation and clean architecture rules
---

// turbo-all

# Develop / Extend a Module

This workflow enforces architectural rules when adding features, endpoints, or business logic to an existing module.
It ensures clean layer separation: **Controller = happy case only**, **Service = error handling + business logic**, **Middleware = cross-cutting concerns**.

## Core Principles

### Error Flow

```
Request → [Middleware chain] → Controller → Service → Repository
                                   │            │
                                   │            └─ throw AppError (business errors + code)
                                   │
                                   └─ NEVER catches errors — let asyncHandler propagate
                                         ↓
                                   errorHandler middleware
```

- **Controller**: Only handles the happy case. NO `try...catch`, NO error checking beyond trivial null-guard.
- **Service**: ALL business validation and error throwing happens here. Use `AppError` with custom domain codes (`X_CODES`). NEVER return `null`/`false` to indicate failure — always `throw`.
- **Middleware**: Handles cross-cutting concerns (auth, validation, rate limiting, upload). NEVER contains business logic. Errors go through `next(new AppError(...))`.
- **errorHandler middleware**: Catches all propagated errors and sends standardized responses.

### Layer Responsibility Summary

| Layer | Does | Does NOT |
|---|---|---|
| **Controller** | Extract `req` data, call Service, send `OK`/`CREATED` response | Try-catch, business logic, DB access, data transformation |
| **Service** | Business rules, validation, throw errors, call Repository | Import Model, call `res`, know about HTTP |
| **Repository** | Query DB using Model, return raw documents | Throw errors, contain business logic |
| **Middleware** | Auth check, rate limit, input validation (Joi), file upload | Business logic, DB queries, import Service/Controller |
| **Route** | Compose middleware chain → `asyncHandler(controller.method)` | Contain logic, skip asyncHandler |

---

## Steps — When Adding a New Endpoint

### 1. Service First — `src/domain/x/services/x.service.js`

**Always start with the Service.** This is where all logic lives.

- Write the business method with full error handling
- Throw `AppError` with specific domain code for ALL failure cases
- `try...catch` is allowed ONLY for wrapping external library errors (JWT, bcrypt, etc.)
- Call Repository methods, NEVER import Model directly
- Strip sensitive fields before returning: `.toObject()` + `delete`

```js
// ✅ CORRECT — Service throws on all error cases
async getById(id) {
  const doc = await xRepository.findById(id);
  if (!doc) throw new AppError(X_CODES.X_NOT_FOUND, 404);
  return doc;
}

// ❌ WRONG — returning null for caller to check
async getById(id) {
  return await xRepository.findById(id); // might be null
}
```

### 2. Repository (if new query needed) — `src/domain/x/repositories/x.repository.js`

- Add only data access methods
- Return raw Mongoose documents — do NOT throw errors here
- Use `paginateQuery()` for list queries with filter/sort/paginate
- Be explicit with `.select()` and `.populate()` projections

### 3. Controller — `src/domain/x/controllers/x.controller.js`

**Controller is a thin adapter: extract → call → respond.** That's it.

- Extract data from `req` (body, params, query)
- Call ONE Service method
- Send response with `response.success(...)` or `response.paginate(...)`
- **NO `try...catch`** — errors propagate via `asyncHandler` → `errorHandler`
- **NO business logic** — no conditionals checking business rules
- **NO direct DB access** — no importing Repository or Model
- Data mapping in response is OK (selecting which fields to return)

```js
// ✅ CORRECT — happy path only
async create(req, res) {
  const result = await xService.create(req.body);
  return response.success(res, result, 201, "Created successfully", X_CODES.SUCCESS);
}

// ❌ WRONG — error handling in controller
async create(req, res) {
  try {
    const result = await xService.create(req.body);
    if (!result) throw new AppError(X_CODES.CREATION_FAILED, 400);
    return response.success(res, result);
  } catch (err) { ... }
}
```

### 4. Validation — `src/domain/x/validations/x.validation.js`

- Add/update Joi schemas for the new endpoint
- Use `{ body, params, query }` structure
- Always specify `.required()` / `.optional()`
- Complex business validation belongs in Service, NOT in Joi schemas

### 5. Route — `src/domain/x/routes/x.route.js`

- Add the new route with proper middleware chain
- Order: `[Auth] → [Rate Limit] → [Validate] → [Upload] → asyncHandler(controller.method)`
- EVERY controller method MUST be wrapped with `asyncHandler()`
- NEVER skip validation middleware for endpoints that accept input

```js
router.post(
  "/",
  verifyToken,                          // auth
  validate(xValidation.create),         // input validation
  asyncHandler(xController.create),     // handler (wrapped!)
);
```

### 6. Register Route (if new route file) — `src/routes/index.js`

Only needed if you created a new route file:
```js
router.use("/x", xRoutes);
```

---

## Steps — When Modifying Existing Logic

### 1. Identify Impact

- Which layers are affected?
- Does the change affect API response shape? (potential breaking change)
- Does it need new/updated validation?

### 2. Breaking Change Detection

Before modifying, check for these breaking changes:

| Change | Breaking? | Action |
|---|---|---|
| Remove/rename a response field | ❌ Yes | Document in changelog, coordinate with frontend |
| Change field type in response (e.g., string → number) | ❌ Yes | Version the endpoint or migrate clients |
| Add new required field to request body | ❌ Yes | Make it optional with default, or version |
| Change auth level (public → protected) | ❌ Yes | Coordinate with frontend |
| Change validation constraints (stricter) | ⚠️ Possibly | Existing valid requests may start failing |
| Add new optional field to response | ✅ No | Safe to add |
| Add new optional field to request body | ✅ No | Safe to add |

### 3. Work Bottom-Up

Modify in this order to maintain dependency flow:

1. **Model** (if schema change) → follow `/add-new-field` workflow
2. **Repository** (if new query needed)
3. **Service** (business logic change — this is usually where most changes happen)
4. **Controller** (only if response shape changes)
5. **Validation** (if input shape changes)
6. **Route** (if middleware chain changes)

---

## Verification Checklist

After every change, verify:

- [ ] Controller has **NO `try...catch`** blocks
- [ ] Controller does **NO business logic** — only extract, call, respond
- [ ] ALL error cases are handled in **Service** via `throw new AppError(...)`
- [ ] Service NEVER returns `null`/`false` to indicate failure
- [ ] All async route handlers wrapped with `asyncHandler()`
- [ ] Validation schemas exist for all endpoints that accept input
- [ ] Response uses `response.success()`/`response.paginate()`, NOT `res.status().json()`
- [ ] No `console.log` — use `logger` from utils
- [ ] `"use strict"` on line 1
- [ ] Import flow follows: Router → Controller → Service → Repository → Model
- [ ] Breaking changes documented and communicated
