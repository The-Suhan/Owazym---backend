import { prisma } from "../config/prisma.js";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

let appSettingsSchemaReadyPromise = null;

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return Boolean(fallback);
};

export const TOP10_VOTE_ENABLED_KEY = "top10_vote_enabled";
export const SEASON_EFFECT_KEY = "season_effect";
export const SITE_NOTICE_KEY = "site_notice";
export const SUPPORTED_SEASON_EFFECTS = ["summer", "autumn", "winter", "spring", "ramadan"];

export const ensureAppSettingsSchema = async () => {
  if (!appSettingsSchemaReadyPromise) {
    appSettingsSchemaReadyPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS app_settings (
          setting_key VARCHAR(120) PRIMARY KEY,
          setting_value TEXT NOT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    })().catch((error) => {
      appSettingsSchemaReadyPromise = null;
      throw error;
    });
  }

  return appSettingsSchemaReadyPromise;
};

export const getBooleanSetting = async (key, fallback = false) => {
  await ensureAppSettingsSchema();
  const rows = await prisma.$queryRawUnsafe(
    `SELECT setting_value FROM app_settings WHERE setting_key = $1 LIMIT 1`,
    String(key),
  );
  return normalizeBoolean(rows[0]?.setting_value, fallback);
};

export const getStringSetting = async (key, fallback = "") => {
  await ensureAppSettingsSchema();
  const rows = await prisma.$queryRawUnsafe(
    `SELECT setting_value FROM app_settings WHERE setting_key = $1 LIMIT 1`,
    String(key),
  );
  const value = String(rows[0]?.setting_value ?? fallback ?? "").trim();
  return value || String(fallback ?? "").trim();
};

export const setBooleanSetting = async (key, value) => {
  await ensureAppSettingsSchema();
  const normalizedValue = normalizeBoolean(value, false);
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO app_settings (setting_key, setting_value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (setting_key)
      DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
    `,
    String(key),
    normalizedValue ? "true" : "false",
  );
  return normalizedValue;
};

export const setStringSetting = async (key, value) => {
  await ensureAppSettingsSchema();
  const normalizedValue = String(value ?? "").trim();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO app_settings (setting_key, setting_value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (setting_key)
      DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
    `,
    String(key),
    normalizedValue,
  );
  return normalizedValue;
};

const normalizeSeasonEffect = (value, fallback = "summer") => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (SUPPORTED_SEASON_EFFECTS.includes(normalized)) return normalized;
  return fallback;
};

const normalizeSiteNotice = (value) => {
  const raw = value && typeof value === "object" ? value : {};
  const id = String(raw.id || "").trim();
  const type = String(raw.type || "").trim().toLowerCase();
  const artistName = String(raw.artist_name || raw.artistName || "").trim();
  const url = String(raw.url || "").trim();
  const createdAt = String(raw.created_at || raw.createdAt || "").trim();

  if (!id || !type || !artistName) return null;

  return {
    id,
    type,
    artist_name: artistName,
    url: url || null,
    created_at: createdAt || new Date().toISOString(),
  };
};

export const getTop10VoteEnabled = async () => getBooleanSetting(TOP10_VOTE_ENABLED_KEY, true);

export const setTop10VoteEnabled = async (enabled) => {
  const value = await setBooleanSetting(TOP10_VOTE_ENABLED_KEY, enabled);
  return {
    enabled: value,
  };
};

export const getSeasonEffect = async () => {
  const value = await getStringSetting(SEASON_EFFECT_KEY, "summer");
  return normalizeSeasonEffect(value, "summer");
};

export const setSeasonEffect = async (seasonEffect) => {
  const normalized = normalizeSeasonEffect(seasonEffect, "summer");
  const value = await setStringSetting(SEASON_EFFECT_KEY, normalized);
  return {
    season_effect: normalizeSeasonEffect(value, "summer"),
  };
};

export const getSiteNotice = async () => {
  const raw = await getStringSetting(SITE_NOTICE_KEY, "");
  if (!raw) return null;

  try {
    return normalizeSiteNotice(JSON.parse(raw));
  } catch (_error) {
    return null;
  }
};

export const setSiteNotice = async (notice) => {
  const normalized = normalizeSiteNotice(notice);
  if (!normalized) {
    const error = new Error("site_notice is invalid");
    error.status = 422;
    error.errors = { site_notice: ["site_notice is invalid"] };
    throw error;
  }

  await setStringSetting(SITE_NOTICE_KEY, JSON.stringify(normalized));
  return normalized;
};
