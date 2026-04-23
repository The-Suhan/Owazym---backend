import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

const DATA_URL_RE = /^data:([^;]+);base64,(.+)$/i;

const MIME_TO_EXT = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const absoluteStorageRoot = () =>
  path.isAbsolute(env.storagePublicPath)
    ? env.storagePublicPath
    : path.resolve(process.cwd(), env.storagePublicPath);

const safeRelative = (input) => {
  const normalized = String(input || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .trim();
  if (!normalized || normalized.includes("..")) {
    const error = new Error("Invalid storage path");
    error.status = 422;
    throw error;
  }
  return normalized;
};

const parseDataUrlFile = (file, { label, required, allowedMimes, maxBytes }) => {
  if (!file) {
    if (!required) return null;
    const error = new Error(`${label} is required`);
    error.status = 422;
    error.errors = { [label]: [`${label} is required`] };
    throw error;
  }

  const dataUrl = String(file.dataUrl || file.data || "").trim();
  const match = dataUrl.match(DATA_URL_RE);
  if (!match) {
    const error = new Error(`${label} must be sent as base64 data URL`);
    error.status = 422;
    error.errors = { [label]: [`${label} format is invalid`] };
    throw error;
  }

  const mime = String(match[1] || "").toLowerCase();
  if (allowedMimes?.length && !allowedMimes.includes(mime)) {
    const error = new Error(`${label} type is not supported`);
    error.status = 422;
    error.errors = { [label]: [`${label} mime type is not allowed`] };
    throw error;
  }

  const buffer = Buffer.from(match[2], "base64");
  if (maxBytes && buffer.length > maxBytes) {
    const error = new Error(`${label} is too large`);
    error.status = 422;
    error.errors = { [label]: [`${label} exceeds max size`] };
    throw error;
  }

  const extFromMime = MIME_TO_EXT[mime] || "";
  const extFromName = path.extname(String(file.name || ""))
    .replace(/^\./, "")
    .toLowerCase();
  const ext = extFromMime || extFromName || "bin";

  return {
    buffer,
    ext,
  };
};

export const saveDataUrlFile = async (
  file,
  { folder, label, required = true, allowedMimes = [], maxBytes = 0 },
) => {
  const parsed = parseDataUrlFile(file, { label, required, allowedMimes, maxBytes });
  if (!parsed) return null;

  const relativeFolder = safeRelative(folder);
  const root = absoluteStorageRoot();
  const targetDir = path.resolve(root, relativeFolder);
  await fs.mkdir(targetDir, { recursive: true });

  const filename = `${randomUUID()}.${parsed.ext}`;
  const absolutePath = path.resolve(targetDir, filename);
  await fs.writeFile(absolutePath, parsed.buffer);

  return `${relativeFolder}/${filename}`.replace(/\\/g, "/");
};

export const deleteStorageFile = async (relativePath) => {
  if (!relativePath) return;
  try {
    const root = absoluteStorageRoot();
    const safePath = safeRelative(relativePath);
    const absolutePath = path.resolve(root, safePath);
    if (!absolutePath.startsWith(path.resolve(root))) return;
    await fs.unlink(absolutePath);
  } catch (_error) {}
};

