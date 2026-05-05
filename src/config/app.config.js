import dotenv from "dotenv";

dotenv.config();

const DEFAULT_APP_KEY = "app_secret_key";
const DEFAULT_ACCESS_SECRET = "your-secret-key";
const DEFAULT_REFRESH_SECRET = "your-refresh-secret-key";

const config = {
  app: {
    name: process.env.APP_NAME || "my-app",
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
    key: process.env.APP_KEY || DEFAULT_APP_KEY,
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      channelId: process.env.TELEGRAM_CHANNEL_ID,
    },
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/base-backend",
    dbName: process.env.MONGODB_DB_NAME || "base-backend",
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || DEFAULT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || "local",
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  ai: {
    providers: {
      grok: {
        apiKey: process.env.GROK_API_KEY,
        baseUrl: process.env.GROK_BASE_URL || "https://api.x.ai/v1",
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      },
      // openai: {
      //   apiKey: process.env.OPENAI_API_KEY,
      //   baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      // },
      // anthropic: {
      //   apiKey: process.env.ANTHROPIC_API_KEY,
      //   baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
      // },
      // perplexity: {
      //   apiKey: process.env.PERPLEXITY_API_KEY,
      //   baseUrl: process.env.PERPLEXITY_BASE_URL || "https://api.perplexity.ai",
      // },
    },
    defaults: {
      temperature: 0.7,
      maxTokens: 4096,
      timeoutMs: 120_000,
      maxRetries: 3,
    },
  },
};

export default config;
