import os from "node:os";
import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const resolveNetworkUrl = () => {
  if (env.host && !["0.0.0.0", "::"].includes(env.host)) {
    return `http://${env.host}:${env.port}/api`;
  }

  const interfaces = Object.values(os.networkInterfaces())
    .flat()
    .find((details) => details && details.family === "IPv4" && !details.internal);

  return interfaces ? `http://${interfaces.address}:${env.port}/api` : null;
};

const server = app.listen(env.port, env.host, () => {
  console.log(`Backend API running at http://localhost:${env.port}/api`);

  const networkUrl = resolveNetworkUrl();
  if (networkUrl && networkUrl !== `http://localhost:${env.port}/api`) {
    console.log(`Backend API network URL: ${networkUrl}`);
  }
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
