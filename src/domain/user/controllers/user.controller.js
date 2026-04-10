import userService from "../services/user.service.js";
import response from "../../../shared/utils/response.js";
import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";

class UserController {
  async register(req, res) {
    const result = await userService.register(req.body);

    if (!result) {
      throw new AppError("Failed to register", 400, "BAD_REQUEST");
    }

    return response.success(res, { user: result.user }, 201, "Register successfully");
  }

  async login(req, res) {
    const result = await userService.login(req.body);

    return response.success(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
    }, 200, "Login successfully");
  }

  async refresh(req, res) {
    const { refreshToken } = req.body;
    const tokens = await userService.refresh(refreshToken);

    return response.success(res, tokens, 200, "Token refreshed");
  }

  async logout(req, res) {
    // Stateless JWT — client chỉ cần xoá token ở phía mình
    return response.success(res, null, 200, "Logout successfully");
  }
}

export default new UserController();

