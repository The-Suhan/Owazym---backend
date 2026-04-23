import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();
const devOriginPattern = /^https?:\/\/((localhost|127\.0\.0\.1)|(\d{1,3}\.){3}\d{1,3})(:((4173)|(5173)))?$/i;
const allowedOrigins = new Set([env.clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin) || (process.env.NODE_ENV !== "production" && devOriginPattern.test(origin))) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/storage", express.static(env.storagePublicPath));

app.use(routes);
app.use(notFound);
app.use(errorHandler);

export default app;
