# Base Backend Node.js (RBAC + Generic Upload)

Template backend tối giản cho solo dev/team nhỏ:
- User/Auth với RBAC (`user`, `admin`)
- **AI-Powered Digest**: Tự động tạo bản tin thị trường (4h, Daily, Weekly) sử dụng Grok, GPT-4, Claude.
- Upload file tổng quát (image được convert sang WebP)
- Rate limit + anti-bruteforce cho auth/upload
- Config validation ngay lúc boot
- Swagger/OpenAPI JSON nhẹ

## API Endpoints

### Health
- `GET /api/v1/health`

### API Docs
- `GET /api/v1/docs/openapi.json`

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### News & Digests
- `GET /api/v1/news`
- `GET /api/v1/digests`
- `GET /api/v1/digests/:id`
- `GET /api/v1/digests/slug/:slug`

### Admin Files (RBAC: admin)
- `POST /api/v1/admin/files` (form-data key: `file`)
- `GET /api/v1/admin/files`
- `DELETE /api/v1/admin/files/:id`

### Public File
- `GET /api/v1/files/:id`

## Security/Hardening

- Auth rate limit và login brute-force guard bằng IP + username.
- Upload rate limit riêng cho endpoint admin upload.
- Upload filter chặn MIME/extension nguy hiểm (`.js`, `.html`, `.svg`, `.exe`...).
- Scan nội dung file text để chặn payload script nguy hiểm cơ bản.

## Environment Variables

Copy từ `.env.example` và chỉnh lại giá trị thực tế.

```env
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/base-backend
MONGODB_DB_NAME=base-backend

JWT_SECRET=replace-with-very-strong-secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=replace-with-very-strong-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGINS=http://localhost:5173,http://localhost:3000

AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
LOGIN_BLOCK_WINDOW_MS=900000
LOGIN_MAX_FAILED_ATTEMPTS=5
UPLOAD_RATE_LIMIT_WINDOW_MS=60000
UPLOAD_RATE_LIMIT_MAX=30
MAX_UPLOAD_SIZE_MB=20
FILE_ALLOWED_MIMES=image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,application/zip
```

## Run local

```bash
npm install
npm start

# chạy scheduler process riêng
npm run start:scheduler
```

## Infra structure

- DB/queue connectors nằm trong `src/infra/`.
- Hiện có `src/infra/mongodb.js` và `src/infra/redis.js`.

