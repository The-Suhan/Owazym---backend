import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const STORE_FILE = path.resolve(process.cwd(), "data", "support-messages.json");

let writeChain = Promise.resolve();

const createNotFoundError = () => {
  const error = new Error("Support message not found");
  error.status = 404;
  return error;
};

const ensureStoreFile = async () => {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });

  try {
    await fs.access(STORE_FILE);
  } catch (_error) {
    await fs.writeFile(STORE_FILE, "[]\n", "utf8");
  }
};

const readMessages = async () => {
  await ensureStoreFile();

  const raw = await fs.readFile(STORE_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const writeMessages = async (messages) => {
  await fs.writeFile(STORE_FILE, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
};

const sortByNewest = (messages) =>
  [...messages].sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));

const runExclusive = async (handler) => {
  const previous = writeChain;
  let release = () => {};

  writeChain = new Promise((resolve) => {
    release = resolve;
  });

  await previous;

  try {
    return await handler();
  } finally {
    release();
  }
};

const normalizeMessage = (entry = {}) => ({
  id: String(entry.id || "").trim(),
  name: String(entry.name || "").trim(),
  email: String(entry.email || "").trim(),
  message: String(entry.message || "").trim(),
  userId: entry.userId == null ? null : String(entry.userId),
  userName: String(entry.userName || "").trim(),
  ip: String(entry.ip || "").trim(),
  userAgent: String(entry.userAgent || "").trim(),
  isRead: entry.isRead === true,
  createdAt: String(entry.createdAt || "").trim(),
  readAt: entry.readAt ? String(entry.readAt) : null,
});

export const supportService = {
  async sendMessage(payload) {
    return runExclusive(async () => {
      const messages = await readMessages();
      const createdAt = new Date().toISOString();
      const entry = normalizeMessage({
        id: randomUUID(),
        name: String(payload.name || payload.userName || "Anonymous").trim() || "Anonymous",
        email: String(payload.email || "").trim(),
        message: payload.message,
        userId: payload.userId,
        userName: payload.userName,
        ip: payload.ip,
        userAgent: payload.userAgent,
        isRead: false,
        createdAt,
        readAt: null,
      });

      messages.unshift(entry);
      await writeMessages(messages);

      return {
        id: entry.id,
        createdAt: entry.createdAt,
        isRead: entry.isRead,
      };
    });
  },

  async listMessages() {
    const messages = await readMessages();
    return sortByNewest(messages).map(normalizeMessage);
  },

  async markMessageRead(id) {
    return runExclusive(async () => {
      const safeId = String(id || "").trim();
      const messages = await readMessages();
      const entry = messages.find((message) => String(message.id || "").trim() === safeId);

      if (!entry) {
        throw createNotFoundError();
      }

      if (entry.isRead !== true) {
        entry.isRead = true;
        entry.readAt = new Date().toISOString();
        await writeMessages(messages);
      }

      return normalizeMessage(entry);
    });
  },

  async deleteMessage(id) {
    return runExclusive(async () => {
      const safeId = String(id || "").trim();
      const messages = await readMessages();
      const index = messages.findIndex((message) => String(message.id || "").trim() === safeId);

      if (index < 0) {
        throw createNotFoundError();
      }

      const [removed] = messages.splice(index, 1);
      await writeMessages(messages);

      return normalizeMessage(removed);
    });
  },
};
