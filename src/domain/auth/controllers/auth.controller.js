import { OK, CREATED } from "../../../shared/utils/response.js";
import authService from "../services/auth.service.js";

class AuthController {
  async register(req, res) {
    const result = await authService.register(req.body);
    return new CREATED({
      data: { user: result.user },
      message: "Registered successfully"
    }).send(res);
  }

  // Uses passport-local middleware before reaching here
  async login(req, res) {
    // req.user is set by passport
    const result = await authService.generateTokensForUser(req.user);
    return new OK({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      message: "Login successfully"
    }).send(res);
  }

  async googleCallback(req, res) {
    // req.user is set by passport-google
    const result = await authService.generateTokensForUser(req.user);
    // Usually redirect to frontend with tokens in URL or cookie.
    // We send payload directly or redirect. For API, just JSON is fine if frontend opens popup.
    return new OK({
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      message: "Google login successfully"
    }).send(res);
  }
}

export default new AuthController();
