import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { toNumber } from "../utils/serialize.js";

const normalizePlan = (user) => {
  const plan = String(user?.subscriptionPlan || "").toLowerCase();
  if (["free", "plus", "premium"].includes(plan)) return plan;
  return user?.subscribes ? "premium" : "free";
};

const tokenFor = (user) =>
  jwt.sign(
    {
      sub: toNumber(user.id),
      name: user.name,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

export const authService = {
  async register({ name, password }) {
    const existing = await prisma.user.findUnique({ where: { name } });
    if (existing) {
      const error = new Error("Username already exists");
      error.status = 422;
      error.errors = { name: ["Username already exists"] };
      throw error;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        password: hashed,
        subscribes: false,
        subscriptionPlan: "free",
        downloadsUsedMonth: 0,
      },
    });

    const token = tokenFor(user);
    return {
      token,
      user: {
        id: toNumber(user.id),
        name: user.name,
        subscription_plan: normalizePlan(user),
      },
    };
  },

  async login({ name, password }) {
    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) {
      const error = new Error("Invalid username or password");
      error.status = 401;
      throw error;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const error = new Error("Invalid username or password");
      error.status = 401;
      throw error;
    }

    const token = tokenFor(user);
    return {
      token,
      user: {
        id: toNumber(user.id),
        name: user.name,
        subscription_plan: normalizePlan(user),
      },
    };
  },

  me(user) {
    return {
      id: toNumber(user.id),
      name: user.name,
      subscription_plan: normalizePlan(user),
      subscribes: Boolean(user.subscribes),
      downloads_used_month: Number(user.downloadsUsedMonth || 0),
      downloads_month_starts_at: user.downloadsMonthStartsAt ? user.downloadsMonthStartsAt.toISOString().slice(0, 10) : null,
    };
  },
};
