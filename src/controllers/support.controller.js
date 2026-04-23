import { ok } from "../utils/response.js";
import { supportService } from "../services/support.service.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_ONLY_MESSAGE_REGEX = /^[\d\s]+$/;

const createValidationError = (message) => {
  const error = new Error(message);
  error.status = 422;
  return error;
};

export const supportController = {
  async sendMessage(req, res, next) {
    try {
      const name = String(req.body.name || req.user?.name || "").trim();
      const email = String(req.body.email || "").trim();
      const message = String(req.body.message || "").trim();
      const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
      const ip = forwardedFor || String(req.ip || "").trim();
      const userAgent = String(req.get("user-agent") || "").trim();

      if (name.length > 100) {
        throw createValidationError("Name must be 100 characters or fewer");
      }
      if (email && (email.length > 160 || !EMAIL_REGEX.test(email))) {
        throw createValidationError("Please enter a valid email address");
      }
      if (!message) {
        throw createValidationError("Message is required");
      }
      if (DIGITS_ONLY_MESSAGE_REGEX.test(message)) {
        throw createValidationError("Message cannot contain only digits");
      }
      if (message.length > 5000) {
        throw createValidationError("Message must be 5000 characters or fewer");
      }

      const data = await supportService.sendMessage({
        name,
        email,
        message,
        userId: req.user?.id,
        userName: req.user?.name,
        ip,
        userAgent,
      });

      return ok(res, data, "Support message sent", 201);
    } catch (error) {
      return next(error);
    }
  },
};
