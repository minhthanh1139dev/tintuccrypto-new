import userService from "../services/user.service.js";
import { OK, CREATED } from "../../../shared/utils/response.js";
import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";

class UserController {
  async register(req, res) {
    const result = await userService.register(req.body);

    if (!result) {
      throw new AppError("Failed to register", 400, "BAD_REQUEST");
    }

    return new CREATED({ data: { user: result.user }, message: "Register successfully" }).send(res);
  }

  async login(req, res) {
    const result = await userService.login(req.body);

    return new OK({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      message: "Login successfully"
    }).send(res);
  }

  async refresh(req, res) {
    const { refreshToken } = req.body;
    const tokens = await userService.refresh(refreshToken);

    return new OK({ data: tokens, message: "Token refreshed" }).send(res);
  }

  async logout(req, res) {
    // Stateless JWT — client chỉ cần xoá token ở phía mình
    return new OK({ message: "Logout successfully" }).send(res);
  }
}

export default new UserController();

