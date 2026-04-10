---
description: Security checklist to run when adding or modifying API endpoints
---

// turbo-all

# Security Review

Run this checklist when adding new endpoints, modifying auth logic, or exposing new data.

## 1. Authentication & Authorization

- [ ] **Auth middleware applied?** — Protected endpoints use `verifyToken` / `verifyAdmin` / `verifyUser`
- [ ] **Correct auth level?** — Admin-only endpoints use `verifyAdmin`, not just `verifyToken`
- [ ] **Public endpoints intentional?** — If no auth middleware, confirm this endpoint SHOULD be public
- [ ] **Token payload minimal?** — JWT contains only `{ id, role }`, no sensitive data

```js
// ✅ CORRECT — auth middleware before handler
router.patch("/:id", verifyToken, validate(xValidation.update), asyncHandler(xController.update));

// ❌ WRONG — no auth on a mutation endpoint
router.patch("/:id", validate(xValidation.update), asyncHandler(xController.update));
```

## 2. Input Validation

- [ ] **Joi schema exists?** — Every endpoint that accepts `body`, `params`, or `query` has a validation schema in `src/validations/`
- [ ] **`validate()` middleware in route chain?** — Applied BEFORE `asyncHandler(controller.method)`
- [ ] **`stripUnknown: true`?** — Handled by validate middleware, prevents unexpected fields
- [ ] **Params validated?** — `req.params.id` validated as valid MongoDB ObjectId where applicable
- [ ] **No raw user input in DB queries?** — All input passes through Joi before reaching Service/Repository

```js
// ✅ CORRECT — validate params as ObjectId
const getById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(), // MongoDB ObjectId format
  }),
};

// ❌ WRONG — no param validation, raw id goes to DB
router.get("/:id", asyncHandler(xController.getById)); // id could be anything
```

## 3. Rate Limiting

- [ ] **Rate limiter applied?** — Public and sensitive endpoints (login, register, password reset) have `createRateLimiter()`
- [ ] **Brute force guard on login?** — `createBruteForceGuard()` applied to login endpoint
- [ ] **Reasonable limits?** — Window and max values set in `src/constants/app.constants.js`

```js
// ✅ CORRECT — rate limit on sensitive endpoint
router.post(
  "/login",
  createBruteForceGuard(),                    // brute force protection
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 attempts per 15min
  validate(authValidation.login),
  asyncHandler(authController.login),
);

// ❌ WRONG — login without rate limiting
router.post("/login", validate(authValidation.login), asyncHandler(authController.login));
```

## 4. Data Exposure

- [ ] **No password in response?** — Service strips via `.toObject()` + `delete` before returning
- [ ] **No internal IDs leaked?** — Avoid exposing MongoDB `__v`, internal reference IDs users shouldn't see
- [ ] **No token logging?** — JWT tokens, passwords NEVER appear in `logger` output
- [ ] **Error messages generic in production?** — `errorHandler` returns generic message when `NODE_ENV === "production"`

```js
// ✅ CORRECT — strip sensitive data in Service before returning
async getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new NOT_FOUND({ message: "User not found" });

  const result = user.toObject();
  delete result.password;
  delete result.__v;
  return result;
}

// ❌ WRONG — returning raw document with password
async getProfile(userId) {
  return await userRepository.findById(userId); // includes password!
}
```

## 5. File Upload (if applicable)

- [ ] **MIME type validated?** — `upload.middleware.js` checks `allowedMimeTypes`
- [ ] **File size limited?** — `maxFileSize` set in upload config
- [ ] **Dangerous extensions blocked?** — No `.exe`, `.sh`, `.bat`, `.php`, etc.
- [ ] **Storage path outside `src/`?** — Uploads go to `uploads/` directory, not inside source code

```js
// ✅ CORRECT — upload middleware with MIME + size constraints
const upload = createUploadMiddleware({
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxFileSize: 5 * 1024 * 1024, // 5MB
});

router.post("/avatar", verifyToken, upload.single("avatar"), asyncHandler(userController.uploadAvatar));
```

## 6. Middleware Chain Order

Verify the route middleware chain follows this order:

```
[Auth] → [Rate Limit] → [Validate] → [Upload] → asyncHandler(controller.method)
```

- [ ] Auth runs FIRST — reject unauthenticated requests before any processing
- [ ] Rate limit runs BEFORE validation — prevent resource exhaustion from validation processing
- [ ] Validation runs BEFORE business logic — reject bad input early
- [ ] `asyncHandler()` wraps EVERY async controller method

## 7. Cross-Cutting

- [ ] **Helmet headers active?** — Configured in `app.js` (already set up in boilerplate)
- [ ] **CORS configured?** — Only allowed origins (check `config.js`)
- [ ] **No `console.log`** — Use `logger` only, prevents accidental data leak to stdout
- [ ] **`"use strict"` on line 1** — Catches silent errors
