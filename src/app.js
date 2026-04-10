"use strict"

import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import passport from "./domain/auth/passport.js";
import apiRoutes from "./routes/index.js";
import { CORS_ORIGINS } from "./shared/constants/app.constants.js";
import { errorHandler, AppError } from "./shared/middlewares/errorHandler.middleware.js";

const app = express();
const trustProxyEnv = process.env.TRUST_PROXY;

if (trustProxyEnv === "true") {
  app.set("trust proxy", true);
} else if (trustProxyEnv === "false") {
  app.set("trust proxy", false);
} else if (trustProxyEnv !== undefined) {
  const parsedTrustProxy = Number(trustProxyEnv);
  app.set("trust proxy", Number.isNaN(parsedTrustProxy) ? trustProxyEnv : parsedTrustProxy);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.use(
  cors({
    origin: CORS_ORIGINS, // hoặc "*" nếu dev local thoải mái
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(morgan("combined"));
app.use(passport.initialize());
app.use("/api/v1", apiRoutes);

app.use((req, res, next) => next(new AppError("Route Not Found", 404, "NOT_FOUND")));

app.use(errorHandler);

export default app;
