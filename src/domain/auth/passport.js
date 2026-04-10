import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { comparePassword, hashPassword } from "../../shared/utils/password.js";
import userRepository from "../user/repositories/user.repository.js";
import config from "../../config/app.config.js";

// Local Strategy for username & password
passport.use(
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, done) => {
      try {
        const user = await userRepository.findByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "mock-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret",
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userRepository.findByUsername(profile.emails[0].value);
        if (!user) {
          // Create new user if not exists
          const defaultPassword = await hashPassword(Math.random().toString(36).slice(-8)); // Random pass
          const newUser = await userRepository.create({
            username: profile.emails[0].value,
            password: defaultPassword,
            role: "user",
          });
          user = newUser;
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

export default passport;
