---
description: Workflow orchestrator — maps every task type to the correct workflow(s) and execution order
---

// turbo-all

# Agent Workflow Index

Read this file FIRST before starting any task. It tells you which workflow(s) to load and in what order.

---

## Quick Task → Workflow Mapping

| Tác vụ | Workflow cần chạy (theo thứ tự) |
|---|---|
| Thêm field vào model | `add-new-field` → `develop-module` → `security-review` |
| Sửa field trong model | `add-new-field` → `develop-module` → `security-review` |
| Xóa field khỏi model | `add-new-field` → `security-review` |
| Tạo module hoàn toàn mới | `create-new-module` → `security-review` |
| Thêm endpoint mới vào module có sẵn | `develop-module` → `security-review` |
| Sửa business logic / service | `develop-module` |
| Thêm cron job mới | `add-job` |
| Review bảo mật một route | `security-review` |
| Review toàn bộ module | `develop-module` + `security-review` |

---

## Workflow Chains Chi Tiết

### Chain A — Schema Change + API Update
> Dùng khi: thêm/sửa/xóa field trong model VÀ cần cập nhật endpoint liên quan

```
1. add-new-field   → assess impact, update Model + Repository + Service + Controller + Validation
2. develop-module  → nếu cần thêm/sửa endpoint sau khi schema thay đổi
3. security-review → verify auth, validation, data exposure cho các route bị ảnh hưởng
```

### Chain B — New Feature End-to-End
> Dùng khi: có tính năng hoàn toàn mới cần scaffold từ đầu

```
1. create-new-module → tạo Model, Repository, Service, Controller, Validation, Route
2. develop-module    → nếu cần mở rộng thêm sau khi scaffold xong
3. security-review   → bắt buộc sau khi tạo module mới
```

### Chain C — Extend Existing Module
> Dùng khi: module đã có, chỉ cần thêm endpoint hoặc mở rộng logic

```
1. develop-module  → thêm endpoint / sửa business logic
2. security-review → verify route mới
```

### Chain D — Scheduled Job
> Dùng khi: cần chạy task tự động theo lịch

```
1. add-job → tạo job file, implement service method, register trong scheduler
```
> Lưu ý: Nếu service method chưa tồn tại, đọc thêm `develop-module` phần Service trước khi viết action.

### Chain E — Security Audit Only
> Dùng khi: cần review bảo mật một route hoặc module đang có

```
1. security-review → chạy toàn bộ checklist, report các vấn đề
```

---

## Dependency Map — Layer nào phụ thuộc layer nào

```
Router → Controller → Service → Repository → Model
   ↑           ↑          ↑           ↑
Middleware  Validation  (throws)   (returns raw)
```

**Quy tắc cứng:** KHÔNG ĐƯỢC import ngược chiều. Xem `SKILL.md` section 2 để biết chi tiết.

---

## Dấu hiệu nhận biết tác vụ

Khi user mô tả yêu cầu, dùng bảng này để xác định chain:

| Dấu hiệu trong yêu cầu | Chain cần dùng |
|---|---|
| "thêm trường", "thêm field", "thêm cột" | A |
| "xóa field", "bỏ field" | A |
| "tạo module", "tạo tính năng mới", "scaffold" | B |
| "thêm endpoint", "thêm API", "thêm route" | C |
| "sửa logic", "cập nhật service", "fix business rule" | C |
| "tạo job", "scheduled task", "cron" | D |
| "review security", "kiểm tra auth", "audit route" | E |
| "thêm field + thêm endpoint" | A → C → E |

---

## File Reference

| File | Mục đích |
|---|---|
| `SKILL.md` | Convention gốc — architecture rules, coding standards, layer templates |
| `create-new-module.md` | Scaffold module mới từ đầu |
| `develop-module.md` | Thêm/sửa endpoint và logic trong module có sẵn |
| `add-new-field.md` | Thay đổi schema Mongoose an toàn |
| `add-job.md` | Tạo cron job mới |
| `security-review.md` | Checklist bảo mật cho route/endpoint |
| `fix-n-plus-one.md` | Phát hiện và fix N+1 query problem |

---

## Verification Flow (Sau Mỗi Task)

Sau khi hoàn thành bất kỳ chain nào, agent PHẢI tự kiểm tra:

- [ ] Import flow đúng chiều: Router → Controller → Service → Repository → Model
- [ ] Không có `try...catch` trong Controller
- [ ] Không có business logic trong Controller
- [ ] Tất cả errors throw từ Service bằng `AppError` kèm custom code `X_CODES`
- [ ] Tất cả async route handlers wrapped bằng `asyncHandler()`
- [ ] Không có `console.log` — dùng `logger`
- [ ] `"use strict"` ở dòng 1 mọi file mới
- [ ] Response dùng `response.success()` hoặc `response.paginate()`, không dùng `res.status().json()`
