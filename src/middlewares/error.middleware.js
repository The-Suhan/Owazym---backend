import { fail } from "../utils/response.js";

export const errorHandler = (error, _req, res, _next) => {
  const status = error.status || 500;
  const message = error.message || "Internal server error";
  const errors = error.errors || null;
  return fail(res, message, errors, status);
};
