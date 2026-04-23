import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { fail } from "../utils/response.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return fail(res, "Unauthorized", { token: "Missing bearer token" }, 401);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: BigInt(payload.sub) },
    });

    if (!user) {
      return fail(res, "Unauthorized", { token: "Invalid token user" }, 401);
    }

    req.user = user;
    return next();
  } catch (error) {
    return fail(res, "Unauthorized", { token: "Invalid or expired token" }, 401);
  }
};
