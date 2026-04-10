import express from "express";
import passport from "../passport.js";
import authController from "../controllers/auth.controller.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import userValidation from "../../user/validations/user.validation.js";

const router = express.Router();

router.post("/register", validate(userValidation.register), authController.register);

router.post(
  "/login",
  validate(userValidation.login),
  passport.authenticate("local", { session: false }),
  authController.login
);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authController.googleCallback
);

export default router;
