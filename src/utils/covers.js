import { env } from "../config/env.js";
import { toNumber } from "./serialize.js";

const palettes = [
  ["#0f172a", "#1e293b"],
  ["#064e3b", "#065f46"],
  ["#3b0764", "#581c87"],
  ["#3f1d0a", "#7c2d12"],
  ["#172554", "#1d4ed8"],
  ["#4c0519", "#be123c"],
];

const escape = (text) =>
  String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const resolveStorageUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${env.uploadBaseUrl}/${String(path).replace(/^\//, "")}`;
};

export const fallbackCover = (id, title) => {
  const pair = palettes[toNumber(id) % palettes.length];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${pair[0]}"/><stop offset="100%" stop-color="${pair[1]}"/>` +
    `</linearGradient></defs><rect width="1000" height="1000" fill="url(#g)"/>` +
    `<circle cx="500" cy="500" r="250" fill="rgba(255,255,255,0.15)"/>` +
    `<text x="500" y="540" text-anchor="middle" fill="#ffffff" font-size="110" font-family="Arial,sans-serif">OWAZYM</text>` +
    `<text x="500" y="640" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="44" font-family="Arial,sans-serif">${escape(title || "Track")}</text>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};
