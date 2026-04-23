import { prisma } from "../config/prisma.js";
import { toNumber } from "../utils/serialize.js";
import { deleteStorageFile, saveDataUrlFile } from "../utils/upload.js";
import { resolveStorageUrl } from "../utils/covers.js";
import { ensureDisplayCounterSchema } from "../utils/displayCounters.js";
import { getSeasonEffect, getTop10VoteEnabled, setSeasonEffect, setSiteNotice, setTop10VoteEnabled } from "../utils/settings.js";

const ensureName = (value, field = "name") => {
  const name = String(value || "").trim();
  if (!name) {
    const error = new Error(`${field} is required`);
    error.status = 422;
    error.errors = { [field]: [`${field} is required`] };
    throw error;
  }
  return name;
};

const normalizeIdList = (list) => {
  const unique = [...new Set((Array.isArray(list) ? list : [list]).map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0))];
  return unique;
};

const ensureNullableUrl = (value, field = "url") => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid URL protocol");
    }
    return raw;
  } catch (_error) {
    const error = new Error(`${field} must be a valid URL`);
    error.status = 422;
    error.errors = { [field]: [`${field} must be a valid URL`] };
    throw error;
  }
};

const parseNullableCounter = (value, field) => {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  if (!/^\d+$/.test(raw)) {
    const error = new Error(`${field} must be a non-negative integer`);
    error.status = 422;
    error.errors = { [field]: [`${field} must be a non-negative integer`] };
    throw error;
  }
  return BigInt(raw);
};

const mapMusicListItem = (music) => ({
  id: toNumber(music.id),
  name: music.name,
  artist: (music.musicArtist || []).map((item) => item.artist?.name).filter(Boolean).join(", "),
  plays: toNumber(music.plays),
  display_plays: music.displayPlays == null ? null : toNumber(music.displayPlays),
  is_popular: Boolean(music.isPopular),
  is_visible: music.isVisible !== false,
});

const SUPPORTED_CATEGORY_LOCALES = ["tm", "ru", "en"];

const normalizeCategoryLocale = (value) => {
  const locale = String(value || "").trim().toLowerCase();
  return SUPPORTED_CATEGORY_LOCALES.includes(locale) ? locale : "tm";
};

const pickCategoryName = (category, locale = "tm") => {
  const safeLocale = normalizeCategoryLocale(locale);
  const translations = Array.isArray(category?.translations) ? category.translations : [];
  const byLocale = translations.find((item) => item.locale === safeLocale)?.name?.trim();
  if (byLocale) return byLocale;

  for (const fallback of SUPPORTED_CATEGORY_LOCALES) {
    const name = translations.find((item) => item.locale === fallback)?.name?.trim();
    if (name) return name;
  }

  const legacyName = String(category?.name || "").trim();
  return legacyName || "Category";
};

const normalizeCategoryNames = (payload = {}) => {
  const fromLegacy = String(payload?.name || "").trim();
  const fromTm = String(payload?.name_tm || payload?.nameTm || "").trim();
  const fromRu = String(payload?.name_ru || payload?.nameRu || "").trim();
  const fromEn = String(payload?.name_en || payload?.nameEn || "").trim();

  const fallback = fromTm || fromRu || fromEn || fromLegacy;
  if (!fallback) {
    const error = new Error("Category name is required");
    error.status = 422;
    error.errors = {
      name: ["Category name is required"],
      name_tm: ["Provide at least one localized category name"],
      name_ru: ["Provide at least one localized category name"],
      name_en: ["Provide at least one localized category name"],
    };
    throw error;
  }

  return {
    tm: fromTm || fallback,
    ru: fromRu || fallback,
    en: fromEn || fallback,
  };
};

export const adminService = {
  async getCreateData({ artistQ = "", musicQ = "", categoryQ = "", locale = "tm" } = {}) {
    await ensureDisplayCounterSchema();
    const categoryLocale = normalizeCategoryLocale(locale);
    const [artists, years, languages, categories, existingArtists, existingMusics, existingCategories, homeBanner, homeBanners, top10VoteEnabled, seasonEffect] =
      await Promise.all([
      prisma.artist.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.year.findMany({
        orderBy: { date: "asc" },
        select: { id: true, date: true },
      }),
      prisma.language.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          translations: {
            where: { locale: { in: SUPPORTED_CATEGORY_LOCALES } },
            select: { locale: true, name: true },
          },
        },
      }),
      prisma.artist.findMany({
        where: artistQ ? { name: { contains: String(artistQ).trim() } } : {},
        orderBy: { id: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          description: true,
          photoPath: true,
          displayListeners: true,
          isPopular: true,
          isVisible: true,
          music: {
            where: {
              music: {
                isVisible: true,
              },
            },
            select: {
              music: {
                select: {
                  plays: true,
                },
              },
            },
          },
        },
      }),
      prisma.music.findMany({
        where: musicQ ? { name: { contains: String(musicQ).trim() } } : {},
        orderBy: { id: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          plays: true,
          displayPlays: true,
          isPopular: true,
          isVisible: true,
          musicArtist: {
            select: {
              artist: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.category.findMany({
        where: categoryQ
          ? {
              OR: [
                { name: { contains: String(categoryQ).trim() } },
                {
                  translations: {
                    some: {
                      name: { contains: String(categoryQ).trim() },
                    },
                  },
                },
              ],
            }
          : {},
        orderBy: { id: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          translations: {
            where: { locale: { in: SUPPORTED_CATEGORY_LOCALES } },
            select: { locale: true, name: true },
          },
          _count: { select: { tracks: true } },
        },
      }),
      prisma.homeBanner.findFirst({
        orderBy: { id: "desc" },
        select: {
          id: true,
          url: true,
          imagePath: true,
          imageUrl: true,
        },
      }),
      prisma.homeBanner.findMany({
        orderBy: { id: "desc" },
        select: {
          id: true,
          url: true,
          imagePath: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      getTop10VoteEnabled(),
      getSeasonEffect(),
    ]);

    return {
      top10_vote_enabled: top10VoteEnabled,
      season_effect: seasonEffect,
      artists: artists.map((item) => ({ id: toNumber(item.id), name: item.name })),
      years: years.map((item) => ({ id: toNumber(item.id), date: item.date })),
      languages: languages.map((item) => ({ id: toNumber(item.id), name: item.name })),
      categories: categories.map((item) => ({
        id: toNumber(item.id),
        name: pickCategoryName(item, categoryLocale),
        names: {
          tm: pickCategoryName(item, "tm"),
          ru: pickCategoryName(item, "ru"),
          en: pickCategoryName(item, "en"),
        },
      })),
      existing_artists: existingArtists.map((item) => ({
        id: toNumber(item.id),
        name: item.name,
        description: item.description || "",
        photo_url: item.photoPath ? resolveStorageUrl(item.photoPath) : null,
        actual_listeners: item.music.reduce((sum, relation) => sum + toNumber(relation.music?.plays), 0),
        display_listeners: item.displayListeners == null ? null : toNumber(item.displayListeners),
        is_popular: Boolean(item.isPopular),
        is_visible: item.isVisible !== false,
      })),
      existing_musics: existingMusics.map(mapMusicListItem),
      existing_categories: existingCategories.map((item) => ({
        id: toNumber(item.id),
        name: pickCategoryName(item, categoryLocale),
        names: {
          tm: pickCategoryName(item, "tm"),
          ru: pickCategoryName(item, "ru"),
          en: pickCategoryName(item, "en"),
        },
        musics_count: Number(item._count?.tracks || 0),
      })),
      home_banner: homeBanner
        ? {
            id: toNumber(homeBanner.id),
            url: homeBanner.url || null,
            image_url: homeBanner.imagePath ? resolveStorageUrl(homeBanner.imagePath) : homeBanner.imageUrl || null,
          }
        : null,
      home_banners: homeBanners.map((item) => ({
        id: toNumber(item.id),
        url: item.url || null,
        image_url: item.imagePath ? resolveStorageUrl(item.imagePath) : item.imageUrl || null,
        created_at: item.createdAt?.toISOString?.() || null,
        updated_at: item.updatedAt?.toISOString?.() || null,
      })),
    };
  },

  async createArtist({ name, description, photo }) {
    const artistName = ensureName(name, "name");
    const artistDescription = ensureName(description, "description");
    const photoPath = await saveDataUrlFile(photo, {
      folder: "artist-photos",
      label: "photo",
      required: false,
      allowedMimes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      maxBytes: 5 * 1024 * 1024,
    });

    try {
      const created = await prisma.artist.create({
        data: {
          name: artistName,
          description: artistDescription,
          photoPath,
        },
        select: { id: true, name: true, description: true, photoPath: true },
      });

      return {
        id: toNumber(created.id),
        name: created.name,
        description: created.description || "",
        photo_path: created.photoPath || null,
      };
    } catch (error) {
      if (photoPath) await deleteStorageFile(photoPath);
      if (error?.code === "P2002") {
        const e = new Error("Artist name already exists");
        e.status = 422;
        e.errors = { name: ["Artist name already exists"] };
        throw e;
      }
      throw error;
    }
  },

  async updateArtist(id, { name, description, photo }) {
    const artistId = BigInt(id);
    const artistName = ensureName(name, "name");
    const artistDescription = ensureName(description, "description");
    const currentArtist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, photoPath: true },
    });

    if (!currentArtist) {
      const error = new Error("Artist not found");
      error.status = 404;
      throw error;
    }

    const nextPhotoPath = await saveDataUrlFile(photo, {
      folder: "artist-photos",
      label: "photo",
      required: false,
      allowedMimes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      maxBytes: 5 * 1024 * 1024,
    });

    try {
      const updated = await prisma.artist.update({
        where: { id: artistId },
        data: {
          name: artistName,
          description: artistDescription,
          ...(nextPhotoPath ? { photoPath: nextPhotoPath } : {}),
        },
        select: { id: true, name: true, description: true, photoPath: true },
      });

      if (nextPhotoPath && currentArtist.photoPath && currentArtist.photoPath !== nextPhotoPath) {
        await deleteStorageFile(currentArtist.photoPath);
      }

      return {
        id: toNumber(updated.id),
        name: updated.name,
        description: updated.description || "",
        photo_path: updated.photoPath || null,
        photo_url: updated.photoPath ? resolveStorageUrl(updated.photoPath) : null,
      };
    } catch (error) {
      if (nextPhotoPath) await deleteStorageFile(nextPhotoPath);
      if (error?.code === "P2002") {
        const e = new Error("Artist name already exists");
        e.status = 422;
        e.errors = { name: ["Artist name already exists"] };
        throw e;
      }
      throw error;
    }
  },

  async createCategory(payload) {
    const names = normalizeCategoryNames(payload);
    try {
      const created = await prisma.$transaction(async (tx) => {
        const category = await tx.category.create({
          data: { name: names.tm },
          select: { id: true, name: true },
        });

        await tx.categoryTranslation.createMany({
          data: SUPPORTED_CATEGORY_LOCALES.map((locale) => ({
            categoryId: category.id,
            locale,
            name: names[locale],
          })),
          skipDuplicates: true,
        });

        return category;
      });

      return {
        id: toNumber(created.id),
        name: created.name,
        names,
      };
    } catch (error) {
      if (error?.code === "P2002") {
        const e = new Error("Category translation already exists");
        e.status = 422;
        e.errors = { name: ["Category translation already exists"] };
        throw e;
      }
      throw error;
    }
  },

  async createMusic(payload) {
    const name = ensureName(payload?.name, "name");
    const artistIds = normalizeIdList(payload?.artist_ids || payload?.artistIds);
    const yearId = Number(payload?.year_id || payload?.yearId || 0);
    const languageId = Number(payload?.language_id || payload?.languageId || 0);
    const categoryId = Number(payload?.category_id || payload?.categoryId || 0);

    if (!artistIds.length) {
      const error = new Error("At least one artist is required");
      error.status = 422;
      error.errors = { artist_ids: ["Select at least one artist"] };
      throw error;
    }
    if (!yearId || !languageId || !categoryId) {
      const error = new Error("Year, language and category are required");
      error.status = 422;
      error.errors = { form: ["Year, language and category are required"] };
      throw error;
    }

    const [audioPath, coverPath] = await Promise.all([
      saveDataUrlFile(payload?.audio, {
        folder: "audios",
        label: "audio",
        required: true,
        allowedMimes: [
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/x-wav",
          "audio/ogg",
          "audio/flac",
          "audio/x-flac",
          "audio/mp4",
          "audio/x-m4a",
        ],
        maxBytes: 100 * 1024 * 1024,
      }),
      saveDataUrlFile(payload?.cover, {
        folder: "covers",
        label: "cover",
        required: true,
        allowedMimes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        maxBytes: 10 * 1024 * 1024,
      }),
    ]);

    try {
      const created = await prisma.$transaction(async (tx) => {
        const music = await tx.music.create({
          data: {
            name,
            artistId: BigInt(artistIds[0]),
            yearId: BigInt(yearId),
            languageId: BigInt(languageId),
            categoryId: BigInt(categoryId),
            audioPath,
            coverPath,
          },
          select: { id: true, name: true },
        });

        await tx.musicArtist.createMany({
          data: artistIds.map((artistId) => ({
            musicId: music.id,
            artistId: BigInt(artistId),
          })),
          skipDuplicates: true,
        });

        return music;
      });

      return {
        id: toNumber(created.id),
        name: created.name,
      };
    } catch (error) {
      await Promise.all([deleteStorageFile(audioPath), deleteStorageFile(coverPath)]);
      throw error;
    }
  },

  async setArtistPopular(id, isPopular) {
    const artistId = BigInt(id);
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });
    if (!artist) {
      const error = new Error("Artist not found");
      error.status = 404;
      throw error;
    }

    const updated = await prisma.artist.update({
      where: { id: artistId },
      data: { isPopular: Boolean(isPopular) },
      select: { id: true, isPopular: true },
    });

    return {
      id: toNumber(updated.id),
      is_popular: Boolean(updated.isPopular),
    };
  },

  async setArtistVisibility(id, isVisible) {
    const artistId = BigInt(id);
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });
    if (!artist) {
      const error = new Error("Artist not found");
      error.status = 404;
      throw error;
    }

    const visible = Boolean(isVisible);
    await prisma.$transaction(async (tx) => {
      await tx.artist.update({
        where: { id: artistId },
        data: { isVisible: visible },
        select: { id: true },
      });

      await tx.music.updateMany({
        where: {
          OR: [{ artistId }, { musicArtist: { some: { artistId } } }],
        },
        data: { isVisible: visible },
      });
    });

    return {
      id: toNumber(artistId),
      is_visible: visible,
    };
  },

  async setArtistDisplayListeners(id, displayListeners) {
    await ensureDisplayCounterSchema();
    const artistId = BigInt(id);
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });
    if (!artist) {
      const error = new Error("Artist not found");
      error.status = 404;
      throw error;
    }

    const nextValue = parseNullableCounter(displayListeners, "display_listeners");
    const updated = await prisma.artist.update({
      where: { id: artistId },
      data: { displayListeners: nextValue },
      select: { id: true, displayListeners: true },
    });

    return {
      id: toNumber(updated.id),
      display_listeners: updated.displayListeners == null ? null : toNumber(updated.displayListeners),
    };
  },

  async publishArtistTrackBanner(id) {
    const artistId = BigInt(id);
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!artist) {
      const error = new Error("Artist not found");
      error.status = 404;
      throw error;
    }

    const saved = await setSiteNotice({
      id: `artist-track-${toNumber(artist.id)}-${Date.now()}`,
      type: "artist_track",
      artist_name: artist.name,
      url: `/artist/${toNumber(artist.id)}`,
      created_at: new Date().toISOString(),
    });

    return saved;
  },

  async setMusicPopular(id, isPopular) {
    const musicId = BigInt(id);
    const music = await prisma.music.findUnique({
      where: { id: musicId },
      select: { id: true },
    });
    if (!music) {
      const error = new Error("Music not found");
      error.status = 404;
      throw error;
    }

    const updated = await prisma.music.update({
      where: { id: musicId },
      data: { isPopular: Boolean(isPopular) },
      select: { id: true, isPopular: true },
    });

    return {
      id: toNumber(updated.id),
      is_popular: Boolean(updated.isPopular),
    };
  },

  async setMusicDisplayPlays(id, displayPlays) {
    await ensureDisplayCounterSchema();
    const musicId = BigInt(id);
    const music = await prisma.music.findUnique({
      where: { id: musicId },
      select: { id: true },
    });
    if (!music) {
      const error = new Error("Music not found");
      error.status = 404;
      throw error;
    }

    const nextValue = parseNullableCounter(displayPlays, "display_plays");
    const updated = await prisma.music.update({
      where: { id: musicId },
      data: { displayPlays: nextValue },
      select: { id: true, displayPlays: true },
    });

    return {
      id: toNumber(updated.id),
      display_plays: updated.displayPlays == null ? null : toNumber(updated.displayPlays),
    };
  },

  async setTop10VoteEnabled(enabled) {
    return setTop10VoteEnabled(enabled);
  },

  async setSeasonEffect(seasonEffect) {
    return setSeasonEffect(seasonEffect);
  },

  async upsertBanner(payload) {
    const bannerId = Number(payload?.id || 0);
    const isUpdate = Number.isInteger(bannerId) && bannerId > 0;
    const current = isUpdate
      ? await prisma.homeBanner.findUnique({
          where: { id: BigInt(bannerId) },
          select: { id: true, imagePath: true },
        })
      : null;

    if (isUpdate && !current) {
      const error = new Error("Banner not found");
      error.status = 404;
      throw error;
    }

    const url = ensureNullableUrl(payload?.url, "url");
    const imagePath = await saveDataUrlFile(payload?.image, {
      folder: "home-banners",
      label: "image",
      required: !isUpdate,
      allowedMimes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      maxBytes: 5 * 1024 * 1024,
    });

    try {
      const payloadData = {
        title: "Banner",
        subtitle: null,
        url,
      };

      if (imagePath) {
        payloadData.imagePath = imagePath;
        payloadData.imageUrl = null;
      }

      const saved = isUpdate
        ? await prisma.homeBanner.update({
            where: { id: BigInt(bannerId) },
            data: payloadData,
            select: { id: true, url: true, imagePath: true, imageUrl: true },
          })
        : await prisma.homeBanner.create({
            data: payloadData,
            select: { id: true, url: true, imagePath: true, imageUrl: true },
          });

      if (imagePath && current?.imagePath) {
        await deleteStorageFile(current.imagePath);
      }

      return {
        id: toNumber(saved.id),
        url: saved.url || null,
        image_url: saved.imagePath ? resolveStorageUrl(saved.imagePath) : saved.imageUrl || null,
      };
    } catch (error) {
      if (imagePath) await deleteStorageFile(imagePath);
      throw error;
    }
  },

  async deleteBanner(id) {
    const banner = await prisma.homeBanner.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, imagePath: true },
    });
    if (!banner) {
      const error = new Error("Banner not found");
      error.status = 404;
      throw error;
    }

    await prisma.homeBanner.delete({ where: { id: banner.id } });
    if (banner.imagePath) await deleteStorageFile(banner.imagePath);
    return true;
  },

  async deleteArtist(id) {
    const artist = await prisma.artist.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, photoPath: true },
    });
    if (!artist) {
      const error = new Error("Artist not found");
      error.status = 404;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.music.updateMany({
        where: { artistId: artist.id },
        data: { artistId: null },
      });
      await tx.artist.delete({ where: { id: artist.id } });
    });

    if (artist.photoPath) await deleteStorageFile(artist.photoPath);
    return true;
  },

  async deleteCategory(id) {
    const categoryId = BigInt(id);
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!existing) {
      const error = new Error("Category not found");
      error.status = 404;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.music.updateMany({
        where: { categoryId },
        data: { categoryId: null },
      });
      await tx.category.delete({ where: { id: categoryId } });
    });
    return true;
  },

  async deleteMusic(id) {
    const music = await prisma.music.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        audioPath: true,
        coverPath: true,
      },
    });
    if (!music) {
      const error = new Error("Music not found");
      error.status = 404;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.playlistTrack.deleteMany({ where: { musicId: music.id } });
      await tx.musicArtist.deleteMany({ where: { musicId: music.id } });
      await tx.music.delete({ where: { id: music.id } });
    });

    await Promise.all([deleteStorageFile(music.audioPath), deleteStorageFile(music.coverPath)]);
    return true;
  },
};
