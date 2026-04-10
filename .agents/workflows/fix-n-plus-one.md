---
description: Workflow for detecting and fixing N+1 query problems in Repository and Service layers
---

// turbo-all

# Fix N+1 Query Problem

N+1 occurs when code runs 1 query to fetch a list, then N more queries for each item in the list.
This workflow covers detection patterns and fix strategies within the project's architecture.

## What N+1 Looks Like

```js
// ❌ N+1: 1 query for orders + N queries for each user
const orders = await orderRepository.findAll();        // 1 query → 100 orders
for (const order of orders) {
  const user = await userRepository.findById(order.userId);  // 100 queries!
  order.user = user;
}
```

At 100 orders → 101 DB queries. At 10,000 orders → 10,001 queries.

---

## Detection

### Signs of N+1 in Code Review

Look for these patterns in Service layer:

```js
// ❌ Pattern 1 — loop with await inside
for (const item of items) {
  const related = await someRepository.findById(item.relatedId); // N+1
}

// ❌ Pattern 2 — Promise.all over findById loop (concurrent but still N queries)
const results = await Promise.all(
  items.map((item) => someRepository.findById(item.relatedId)) // still N queries
);

// ❌ Pattern 3 — populate called inside a loop
for (const item of items) {
  await item.populate("user"); // N+1
}
```

### Signs at Runtime

- Endpoint is slow only when list is large
- DB monitoring shows many identical queries with different IDs
- Response time scales linearly with list size

---

## Fix Strategies

### Strategy 1 — Batch Query (Most Common Fix)

Replace N individual queries with 1 batch query using `$in`.

**Step 1: Add batch method to Repository**

```js
// src/repositories/user.repository.js
async findByIds(ids) {
  return await User.find({ _id: { $in: ids } });
}
```

**Step 2: Fix Service to use batch method**

```js
// src/services/order.service.js

// ❌ BEFORE — N+1
async getAllWithUser() {
  const orders = await orderRepository.findAll();
  for (const order of orders) {
    order.user = await userRepository.findById(order.userId);
  }
  return orders;
}

// ✅ AFTER — 2 queries total regardless of list size
async getAllWithUser() {
  const orders = await orderRepository.findAll();

  // 1 batch query for all related users
  const userIds = [...new Set(orders.map((o) => o.userId.toString()))];
  const users = await userRepository.findByIds(userIds);

  // Build lookup map for O(1) access
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  // Attach without additional queries
  return orders.map((order) => ({
    ...order.toObject(),
    user: userMap.get(order.userId.toString()) ?? null,
  }));
}
```

---

### Strategy 2 — Mongoose populate (For Simple Relations)

Use `populate` at the Repository level when the relation is always needed.

```js
// src/repositories/order.repository.js

// ✅ populate at query time — 2 queries (main + join), not N+1
async findAll({ filters, sort, paginator } = {}) {
  return await paginateQuery(Order, {
    filters,
    sort,
    paginator,
    populate: {
      path: "userId",
      select: "name email",    // always specify fields — avoid over-fetching
      model: "User",
    },
  });
}
```

**When to use populate vs batch query:**

| Situation | Use |
|---|---|
| Relation always needed in response | `populate` in Repository |
| Relation needed only sometimes | Batch query in Service |
| Multiple levels of nesting | Batch query — nested populate degrades fast |
| Large collections (>10k docs) | Batch query — populate can be slow |

---

### Strategy 3 — MongoDB Aggregation (For Complex Cases)

When you need to join, group, and compute in one query:

```js
// src/repositories/order.repository.js
async findAllWithUserStats() {
  return await Order.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { name: 1, email: 1 } }],  // project inside lookup
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$userId",
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        user: { $first: "$user" },
      },
    },
  ]);
}
```

**Use aggregation when:**
- Need computed fields (sum, count, average) grouped by relation
- Multiple `$lookup` needed in one query
- Data transformation is simpler in the DB than in JS

---

### Strategy 4 — Cursor for Very Large Datasets

When processing millions of documents in a job/migration, use cursor to avoid loading all into memory:

```js
// src/services/report.service.js (called from a job)
async generateLargeReport() {
  const cursor = await reportRepository.getCursor(); // returns mongoose cursor
  const results = [];

  for await (const doc of cursor) {
    // process one at a time — memory safe
    results.push(this.transform(doc));

    // flush in batches if writing to external storage
    if (results.length >= 500) {
      await this.flush(results.splice(0));
    }
  }

  if (results.length) await this.flush(results);
}

// src/repositories/report.repository.js
getCursor(filter = {}) {
  return Report.find(filter).sort({ createdAt: 1 }).cursor();
}
```

---

## Checklist — Before Merging Any List Endpoint

- [ ] Trace every `await` inside a loop — each one is a potential N+1
- [ ] `Promise.all` over individual `findById` calls → replace with `findByIds` batch
- [ ] `populate` specified `.select()` to avoid over-fetching
- [ ] Aggregation used for computed/grouped data instead of in-memory JS
- [ ] Cursor used for processing very large datasets in jobs
- [ ] Response time tested with at least 100 items in list
- [ ] New batch Repository methods (`findByIds`, etc.) added if needed
