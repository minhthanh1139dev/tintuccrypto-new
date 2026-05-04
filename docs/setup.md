# Setup Local

1. Clone repo
2. `cp .env.example .env`
3. `npm install`
4. `npm start` (or add `npm run dev` with nodemon)

## Environment Variables
| Key                  | Required | Default | Description        |
|----------------------|----------|---------|--------------------|
| PORT                 | ❌       | 3000    | Port app runs on   |
| MONGODB_URI          | ✅       |         | MongoDB string     |
| JWT_SECRET           | ✅       |         | Token secret       |
| JWT_EXPIRES_IN       | ❌       | 15m     | Access token exp   |
| JWT_REFRESH_SECRET   | ✅       |         | Refresh secret     |
| JWT_REFRESH_EXPIRES_IN| ❌       | 7d      | Refresh token exp  |
| CORS_ORIGINS         | ❌       | *       | Allowed origins     |
| GROK_API_KEY         | ❌       |         | xAI API Key        |
| OPENAI_API_KEY       | ❌       |         | OpenAI API Key     |
| ANTHROPIC_API_KEY    | ❌       |         | Anthropic API Key  |
| PERPLEXITY_API_KEY   | ❌       |         | Perplexity API Key |
| STORAGE_PROVIDER     | ❌       | local   | local / s3 / r2    |
| GOOGLE_CLIENT_ID     | ❌       |         | Google OAuth Id    |
| GOOGLE_CLIENT_SECRET | ❌       |         | Google OAuth Sec   |
| S3_ENDPOINT          | ❌       |         | Khi dùng S3/R2     |
| S3_BUCKET            | ❌       |         |                    |
| S3_ACCESS_KEY        | ❌       |         |                    |
| S3_SECRET_KEY        | ❌       |         |                    |
| S3_PUBLIC_URL        | ❌       |         |                    |
