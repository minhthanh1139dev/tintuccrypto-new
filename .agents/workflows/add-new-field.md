---
description: Workflow for safely adding, modifying, or removing a field from a Mongoose model
---

// turbo-all

# Add / Modify / Remove Model Field

This workflow ensures that schema changes are propagated correctly across all layers.

## Pre-Check Questions

Before making the change, answer these:

1. **WHY** is this field needed? What business requirement does it serve?
2. **WHO** queries this field? Check all Repository methods that may be affected.
3. **DOES** this field need an index? Check if any Repository method filters/sorts by this field.
4. **IS** this a breaking change? Will existing documents in the database be affected?

---

## Step 0 — Migration Impact Assessment

Classify the change BEFORE touching any code:

| Change Type | Breaking? | DB Impact | Action Required |
|---|---|---|---|
| **ADD** field with `default` | ✅ Safe | Existing docs get default value automatically | None |
| **ADD** field without `default`, `required: true` | ⚠️ Breaking | Existing docs fail validation on update | Add `default` or run migration |
| **REMOVE** field | ⚠️ Soft break | Existing docs retain orphan data in DB | Optional cleanup script |
| **RENAME** field | ❌ Breaking | Old field name becomes orphan data | Migration script required |
| **CHANGE type** (e.g., String → Number) | ❌ Breaking | Existing data may be invalid type | Migration script required |
| **ADD enum value** | ✅ Safe | No impact | None |
| **REMOVE enum value** | ❌ Breaking | Existing docs with removed value fail validation | Migration script + data cleanup |

**If migration script is required:** write and document the script BEFORE merging the schema change.

---

## Steps

### 1. Update Model — `src/models/x.model.js`

- Add/modify/remove the field in the schema definition
- If adding an `enum` field: list ALL possible values that will be used across the entire codebase
- If the field is frequently queried: add an appropriate index via `Schema.index()`
- If removing a field: existing documents retain the old field in DB — assess if cleanup is needed

```js
// ✅ ADD — safe with default
status: {
  type: String,
  enum: ["active", "inactive"],
  default: "active",
  required: true,
},

// ✅ ADD — index for queried field
XSchema.index({ status: 1 });

// ⚠️ REMOVE — check all Repository queries before deleting
// oldField: { type: String }  ← remove this line
```

### 2. Update Repository — `src/repositories/x.repository.js`

- If the new field is used in queries: add or update Repository methods
- If using `paginateQuery()`: ensure the field is included in filter/sort support
- If removing a field: remove it from any `.select()` projections and filter queries

```js
// ✅ Add new filter support for the field
async findAll({ filters, sort = { createdAt: -1 }, paginator } = {}) {
  return await paginateQuery(X, { filters, sort, paginator });
}

// ✅ Remove orphan .select() reference when field is deleted
// Before: .select("name email oldField")
// After:  .select("name email")
```

### 3. Update Service — `src/services/x.service.js`

- Update business logic that creates/reads/updates documents with the new field
- If the field has validation logic (beyond Joi): add it in the Service
- If the field is sensitive: ensure it's stripped from responses via `.toObject()` + `delete`

```js
// ✅ Strip sensitive field before returning
const doc = await xRepository.findById(id);
const result = doc.toObject();
delete result.sensitiveField;
return result;
```

### 4. Update Controller — `src/controllers/x.controller.js`

- If the field is returned in API responses: add/remove it from the response mapping
- If the field comes from request: ensure Controller passes it to Service

### 5. Update Validation — `src/validations/x.validation.js`

- Add/update Joi schema for the new field in relevant schemas (create, update, etc.)
- Ensure proper type, constraints, and required/optional status
- If removing a field: remove it from all Joi schemas to prevent stripping warnings

```js
// ✅ Add new field to Joi schema
status: Joi.string().valid("active", "inactive").optional(),

// ✅ Enum values in Joi MUST match enum values in Model exactly
```

### 6. Verify Consistency

- [ ] Migration impact assessed (Step 0 completed)
- [ ] Model enum values match ALL values used in Service logic
- [ ] Model indexes match query patterns in Repository
- [ ] Validation schema matches Model field constraints
- [ ] Controller response includes/excludes the field as intended
- [ ] No orphan references to removed fields in any layer
- [ ] If breaking change: migration script written and documented
