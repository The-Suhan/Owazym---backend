import { authService } from "../services/auth.service.js";
import { ok } from "../utils/response.js";

export const authController = {
  async register(req, res, next) {
    try {
      const { name, password } = req.body;
      if (!name || String(name).trim().length < 3) {
        const error = new Error("Username must be at least 3 characters");
        error.status = 422;
        throw error;
      }
      if (!password || String(password).length < 8) {
        const error = new Error("Password must be at least 8 characters");
        error.status = 422;
        throw error;
      }

      const data = await authService.register({
        name: String(name).trim(),
        password: String(password),
      });
      return ok(res, data, "Registered successfully", 201);
    } catch (error) {
      return next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { name, password } = req.body;
      if (!name || !password) {
        const error = new Error("name and password are required");
        error.status = 422;
        throw error;
      }
      const data = await authService.login({
        name: String(name).trim(),
        password: String(password),
      });
      return ok(res, data, "Logged in");
    } catch (error) {
      return next(error);
    }
  },

  async me(req, res) {
    return ok(res, authService.me(req.user));
  },

  async logout(_req, res) {
    return ok(res, null, "Logged out");
  },
};
