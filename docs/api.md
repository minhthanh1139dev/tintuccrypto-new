# API Documentation

## Base URL
`/api/v1`

---

## 1. Authentication
Endpoints for user registration and authentication.

### `POST /auth/register`
Register a new user account.
- **Request Body (JSON):**
  - `username` (string, required): Alphanumeric string, min 3 characters, max 30 characters.
  - `password` (string, required): Min 6 characters.
- **Response:**
  - `201 Created`: `{ "success": true, "code": "00000", "message": "Registered successfully", "data": { "user": { ... } } }`
  - `409 Conflict`: If username already exists.

### `POST /auth/login`
Login and retrieve tokens.
- **Request Body (JSON):**
  - `username` (string, required)
  - `password` (string, required)
- **Response:**
  - `200 OK`: `{ "success": true, "code": "00000", "message": "Login successfully", "data": { "user": { ... }, "accessToken": "...", "refreshToken": "..." } }`
  - `401 Unauthorized`: Invalid credentials.

### `GET /auth/google`
Initiate Google OAuth login flow. (Browser redirects here).

### `GET /auth/google/callback`
Google OAuth callback endpoint.
- **Query Parameters:** Included automatically by Google.
- **Response:**
  - `200 OK`: `{ "success": true, "message": "Google login successfully", "data": { "user": { ... }, "accessToken": "...", "refreshToken": "..." } }`

---

## 2. Users (`/users`)
Endpoints for user management and session control.

### `POST /users/refresh`
Refresh an expired access token using the refresh token.
- **Request Body (JSON):**
  - `refreshToken` (string, required)
- **Response:**
  - `200 OK`: `{ "success": true, "message": "Token refreshed", "data": { "accessToken": "...", "refreshToken": "..." } }`
  - `401 Unauthorized`: Missing or invalid refresh token.

### `POST /users/logout`
Logout a user session.
- **Request Body:** Empty JSON object `{}`.
- **Response:**
  - `200 OK`: `{ "success": true, "message": "Logout successfully", "data": null }`

---

## 3. Files (Public Access) (`/files`)
Retrieve and stream uploaded files. These endpoints do NOT require authentication.

### `GET /files`
Get metadata of all public files.
- **Query Parameters:** None.
- **Response:**
  - `200 OK`: `{ "success": true, "message": "Files retrieved successfully", "data": [ { "id": "...", "originalName": "...", "storageKey": "...", "url": "...", "mime": "...", "size": 123, "kind": "...", "isPublic": true, "createdAt": "..." } ] }`

### `GET /files/image/:id`
Stream an image file.
- **Path Parameters:**
  - `id` (string, required): File ID
- **Response:** Image binary stream (e.g., `image/jpeg`).

### `GET /files/video/:id`
Stream a video file.
- **Path Parameters:**
  - `id` (string, required): File ID
- **Response:** Video binary stream (e.g., `video/mp4`).

### `GET /files/document/:id`
Stream a document file.
- **Path Parameters:**
  - `id` (string, required): File ID
- **Response:** Document binary stream (e.g., `application/pdf`).

### `GET /files/:id`
Fallback generic download for any file type.
- **Path Parameters:**
  - `id` (string, required): File ID
- **Response:** Binary stream of the file.

---

## 5. News (`/news`)
Endpoints for viewing aggregated crypto news.

### `GET /news`
List all news items.
- **Query Parameters:**
    - `page` (number): Default: 1.
    - `limit` (number): Default: 20.
    - `region` (string): `global|vietnam`.
    - `category` (string): Filter by category.
    - `sentiment` (string): `bullish|bearish|neutral`.
- **Response:**
    - `200 OK`: Standard paginated response.

---

## 6. Digests (`/digests`)
Endpoints for viewing AI-generated market digests.

### `GET /digests`
List all generated digests.
- **Query Parameters:**
    - `page` (number): Default: 1.
    - `limit` (number): Default: 10.
    - `type` (string): `4h|daily|weekly|monthly`.
    - `region` (string): `global|vietnam`.
- **Response:**
    - `200 OK`: Standard paginated response.

### `GET /digests/:id`
Get a specific digest by ID.

### `GET /digests/slug/:slug`
Get a specific digest by its slug (e.g., `daily-global-2024-05-14`).

---

## 4. Admin Files (Protected) (`/admin/files`)
Must be authenticated and have the `admin` role.
**Headers Required for all endpoints:** `Authorization: Bearer <accessToken>`

### `POST /admin/files/image`
Upload a single image.
- **Request Format:** `multipart/form-data`
  - `file` (file, required): Only image types (`image/jpeg`, `image/png`, `image/webp`). Max size: 5MB.
- **Response:**
  - `201 Created`: `{ "success": true, "message": "File uploaded successfully", "data": { "id": "...", "url": "...", "kind": "image", ... } }`

### `POST /admin/files/document`
Upload a single document.
- **Request Format:** `multipart/form-data`
  - `file` (file, required): PDF or Word docs (`application/pdf`, `application/msword`, `docx`). Max size: 10MB.
- **Response:**
  - `201 Created`: Metadata of the uploaded document.

### `POST /admin/files/video`
Upload a single video.
- **Request Format:** `multipart/form-data`
  - `file` (file, required): Video files (`video/mp4`, `video/webm`). Max size: 50MB.
- **Response:**
  - `201 Created`: Metadata of the uploaded video.

### `POST /admin/files`
Upload any permitted file type.
- **Request Format:** `multipart/form-data`
  - `file` (file, required): Any allowed file type. Max size: 10MB.
- **Response:**
  - `201 Created`: Metadata of the uploaded file.

### `GET /admin/files`
List all files in the system.
- **Query Parameters:** None.
- **Response:**
  - `200 OK`: Array of file metadata objects.

### `DELETE /admin/files/:id`
Delete a specific file from the database and storage.
- **Path Parameters:**
  - `id` (string, required): The ID of the file to delete.
- **Response:**
  - `200 OK`: `{ "success": true, "message": "File deleted successfully", "data": null }`
