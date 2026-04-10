"use strict"

import jwt from "jsonwebtoken";
import config from "../../config/app.config.js";

export const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiry });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};
