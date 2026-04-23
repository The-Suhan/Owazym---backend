import "./env.js";
import prismaClient from "../../generated/prisma/index.js";

const { PrismaClient } = prismaClient;

export const prisma = new PrismaClient();
