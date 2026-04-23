import { fail } from "../utils/response.js";

export const notFound = (req, res) => fail(res, `Route not found: ${req.method} ${req.originalUrl}`, null, 404);
