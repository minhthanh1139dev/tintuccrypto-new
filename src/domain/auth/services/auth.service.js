import { hashPassword } from "../../../shared/utils/password.js";
import { signAccessToken, signRefreshToken } from "../../../shared/utils/jwt.js";
import userRepository from "../../user/repositories/user.repository.js";
import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";
import { USER_CODES } from "../../user/constants/user.codes.js";

class AuthService {
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

  async generateTokensForUser(user) {
    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const userResponse = user.toObject ? user.toObject() : { ...user };
    delete userResponse.password;

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }
}

export default new AuthService();
