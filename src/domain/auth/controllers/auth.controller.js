import response from "../../../shared/utils/response.js";
import authService from "../services/auth.service.js";

class AuthController {
  async register(req, res) {
    const result = await authService.register(req.body);
    return response.success(res, { user: result.user }, 201, "Registered successfully");
  }

  // Uses passport-local middleware before reaching here
  async login(req, res) {
    // req.user is set by passport
    const result = await authService.generateTokensForUser(req.user);
    return response.success(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 200, "Login successfully");
  }

  async googleCallback(req, res) {
    // req.user is set by passport-google
    const result = await authService.generateTokensForUser(req.user);
    // Usually redirect to frontend with tokens in URL or cookie.
    // We send payload directly or redirect. For API, just JSON is fine if frontend opens popup.
    return response.success(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 200, "Google login successfully");
  }
}

export default new AuthController();
