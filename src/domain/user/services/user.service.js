"use strict"

import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";
import userRepository from "../repositories/user.repository.js";
import { hashPassword, comparePassword } from "../../../shared/utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../shared/utils/jwt.js";
import { USER_CODES } from "../constants/user.codes.js";

class UserService {
  async register({ username, password }) {
    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) {
      throw new AppError(USER_CODES.USERNAME_EXISTS, 409);
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await userRepository.create({
      username,
      password: hashedPassword,
      role: "user",
    });

    if (!newUser) {
      throw new AppError(USER_CODES.USER_NOT_REGISTERED, 403);
    }

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return { user: userResponse };
  }

  async login({ username, password }) {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new AppError(USER_CODES.LOGIN_FAILED, 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError(USER_CODES.LOGIN_FAILED, 401);
    }

    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const userResponse = user.toObject();
    delete userResponse.password;

    return { user: userResponse, accessToken, refreshToken };
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new AppError(USER_CODES.REFRESH_TOKEN_MISSING, 401);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(USER_CODES.REFRESH_TOKEN_INVALID, 401);
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError(USER_CODES.USER_NOT_FOUND, 401);
    }

    const payload = { id: user._id, role: user.role };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }
}

export default new UserService();
