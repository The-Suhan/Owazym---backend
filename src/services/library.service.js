import prismaClient from "../../generated/prisma/index.js";
import { prisma } from "../config/prisma.js";
import { fallbackCover, resolveStorageUrl } from "../utils/covers.js";
import { ensureDisplayCounterSchema } from "../utils/displayCounters.js";
import { getSeasonEffect, getSiteNotice, getTop10VoteEnabled } from "../utils/settings.js";
import { toNumber } from "../utils/serialize.js";

const { Prisma } = prismaClient;
const PUBLIC_PLAYS_VISIBILITY_THRESHOLD = 1000;

const normalizePlan = (user) => {
  const plan = String(user?.subscriptionPlan || "").toLowerCase();
  if (["free", "plus", "premium"].includes(plan)) return plan;
  return user?.subscribes ? "premium" : "free";
};

const PLAN_FEATURES = {
  free: {
    playlistLimit: 1,
    canDownload: false,
    monthlyDownloadLimit: null,
    unlimitedDownloads: false,
  },
  plus: {
    playlistLimit: 5,
    canDownload: true,
    monthlyDownloadLimit: 30,
    unlimitedDownloads: false,
  },
  premium: {
    playlistLimit: null,
    canDownload: true,
    monthlyDownloadLimit: null,
    unlimitedDownloads: true,
  },
};

const getPlanFeatures = (plan) => PLAN_FEATURES[plan] || PLAN_FEATURES.free;

const isSameUtcMonth = (firstDate, secondDate) =>
  firstDate instanceof Date &&
  secondDate instanceof Date &&
  firstDate.getUTCFullYear() === secondDate.getUTCFullYear() &&
  firstDate.getUTCMonth() === secondDate.getUTCMonth();

const getNextMonthDate = (date) => {
  const normalized = date instanceof Date ? date : new Date();
  return new Date(Date.UTC(normalized.getUTCFullYear(), normalized.getUTCMonth() + 1, 1));
};

const resolvePlusDownloadState = async (userId, user, { persist = false } = {}) => {
  const now = new Date();
  const monthStart = user?.downloadsMonthStartsAt ? new Date(user.downloadsMonthStartsAt) : null;
  const used = Number(user?.downloadsUsedMonth || 0);
  const shouldReset = !monthStart || !isSameUtcMonth(monthStart, now) || used < 0;

  if (!shouldReset) {
    return {
      used,
      monthStart,
      monthEnd: getNextMonthDate(monthStart),
    };
  }

  if (persist && userId) {
    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        downloadsUsedMonth: 0,
        downloadsMonthStartsAt: now,
      },
    });
  }

  return {
    used: 0,
    monthStart: now,
    monthEnd: getNextMonthDate(now),
  };
};

const resolvePublicPlayCount = (actualValue, displayValue = null) => {
  const actual = Number(actualValue || 0);
  if (!Number.isFinite(actual) || actual < PUBLIC_PLAYS_VISIBILITY_THRESHOLD) {
    return null;
  }

  const visual = Number(displayValue);
  if (displayValue != null && Number.isFinite(visual) && visual > 0) {
    return visual;
  }

  return actual;
};

const mapArtist = (artist) => ({
  id: toNumber(artist.id),
  name: artist.name,
  description: artist.description || "",
  photo_url: resolveStorageUrl(artist.photoPath),
  display_listeners: artist.displayListeners == null ? null : toNumber(artist.displayListeners),
  is_popular: Boolean(artist.isPopular),
  is_visible: artist.isVisible !== false,
});

const artistSelect = {
  id: true,
  name: true,
  description: true,
  photoPath: true,
  displayListeners: true,
  isPopular: true,
  isVisible: true,
};

const trackSelect = {
  id: true,
  name: true,
  plays: true,
  displayPlays: true,
  isPopular: true,
  isVisible: true,
  audioPath: true,
  coverPath: true,
  year: {
    select: {
      id: true,
      date: true,
    },
  },
  language: {
    select: {
      id: true,
      name: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  musicArtist: {
    select: {
      artistId: true,
      artist: {
        select: artistSelect,
      },
    },
  },
};

const mapTrack = (music) => {
  if (!music || !music.id) return null;
  const artists = (music.musicArtist || []).map((item) => item.artist).filter(Boolean);
  const cover = music.coverPath ? resolveStorageUrl(music.coverPath) : fallbackCover(music.id, music.name);

  return {
    id: toNumber(music.id),
    name: music.name,
    title: music.name,
    artists: artists.map(mapArtist),
    artist: artists.map((artist) => artist.name).join(", "),
    year: music.year?.date ?? null,
    plays: toNumber(music.plays),
    display_plays: resolvePublicPlayCount(music.plays, music.displayPlays),
    monthly_plays: toNumber(music.monthlyPlays ?? music.monthly_plays),
    is_popular: Boolean(music.isPopular),
    is_visible: music.isVisible !== false,
    audio_url: resolveStorageUrl(music.audioPath),
    cover_url: cover,
    category: music.category
      ? {
          id: toNumber(music.category.id),
          name: music.category.name,
        }
      : null,
    language: music.language
      ? {
          id: toNumber(music.language.id),
          name: music.language.name,
        }
      : null,
  };
};

const getCurrentMonthKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const createHttpError = (message, status = 400, errors = null) => {
  const error = new Error(message);
  error.status = status;
  if (errors) error.errors = errors;
  return error;
};

let monthlySchemaReadyPromise = null;
let monthlyVoteSchemaReadyPromise = null;

const ensureMonthlyPlaysSchema = async () => {
  if (!monthlySchemaReadyPromise) {
    monthlySchemaReadyPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE music
        ADD COLUMN IF NOT EXISTS monthly_plays BIGINT NOT NULL DEFAULT 0
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE music
        ADD COLUMN IF NOT EXISTS monthly_plays_month_key VARCHAR(7)
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS music_monthly_top_idx
        ON music (monthly_plays_month_key, is_visible, monthly_plays DESC, id DESC)
      `);
    })().catch((error) => {
      monthlySchemaReadyPromise = null;
      throw error;
    });
  }

  return monthlySchemaReadyPromise;
};

const ensureMonthlyTopTrackVoteSchema = async () => {
  if (!monthlyVoteSchemaReadyPromise) {
    monthlyVoteSchemaReadyPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS monthly_top_track_votes (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          music_id BIGINT NOT NULL REFERENCES music(id) ON DELETE CASCADE,
          month_key VARCHAR(7) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS monthly_top_track_votes_user_month_unique
        ON monthly_top_track_votes (user_id, month_key)
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS monthly_top_track_votes_month_music_idx
        ON monthly_top_track_votes (month_key, music_id)
      `);
    })().catch((error) => {
      monthlyVoteSchemaReadyPromise = null;
      throw error;
    });
  }

  return monthlyVoteSchemaReadyPromise;
};

const orderTracksByIds = (tracks, ids) => {
  const trackMap = new Map(tracks.map((track) => [Number(track.id), track]));
  return ids.map((id) => trackMap.get(Number(id))).filter(Boolean);
};

const getMonthlyTopTrackIds = async ({ artistId, limit }) => {
  await ensureMonthlyPlaysSchema();
  const currentMonthKey = getCurrentMonthKey();
  const artistFilter = artistId
    ? Prisma.sql`
        AND EXISTS (
          SELECT 1
          FROM music_artist ma
          WHERE ma.music_id = m.id
            AND ma.artist_id = ${BigInt(artistId)}
        )
      `
    : Prisma.empty;

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT m.id
      FROM music m
      WHERE m.is_visible = true
        AND m.monthly_plays_month_key = ${currentMonthKey}
        AND m.monthly_plays > 0
        ${artistFilter}
      ORDER BY m.monthly_plays DESC, m.plays DESC, m.id DESC
      LIMIT ${Number(limit)}
    `,
  );

  return rows.map((row) => toNumber(row.id)).filter((id) => id > 0);
};

const getMonthlyTopTracks = async ({ artistId, limit }) => {
  await ensureDisplayCounterSchema();
  const topTrackIds = await getMonthlyTopTrackIds({ artistId, limit });
  if (!topTrackIds.length) return [];

  const rows = await prisma.music.findMany({
    where: {
      id: { in: topTrackIds.map((id) => BigInt(id)) },
      isVisible: true,
    },
    select: trackSelect,
  });

  return orderTracksByIds(rows.map(mapTrack), topTrackIds).slice(0, Number(limit || 10));
};

const getTopTrackVoteSnapshot = async (userId) => {
  await ensureDisplayCounterSchema();
  await ensureMonthlyTopTrackVoteSchema();

  const monthKey = getCurrentMonthKey();
  const voteEnabled = await getTop10VoteEnabled();
  const candidateIds = await getMonthlyTopTrackIds({ limit: 10 });
  const userVoteRows = userId
    ? await prisma.$queryRaw(
        Prisma.sql`
          SELECT music_id, created_at
          FROM monthly_top_track_votes
          WHERE user_id = ${BigInt(userId)}
            AND month_key = ${monthKey}
          LIMIT 1
        `,
      )
    : [];

  const userVoteMusicId = toNumber(userVoteRows[0]?.music_id);
  const displayIds =
    userVoteMusicId > 0 && !candidateIds.includes(userVoteMusicId) ? [...candidateIds, userVoteMusicId] : candidateIds;

  const rows = displayIds.length
    ? await prisma.music.findMany({
        where: {
          id: { in: displayIds.map((id) => BigInt(id)) },
          isVisible: true,
        },
        select: trackSelect,
      })
    : [];

  const voteRows = displayIds.length
    ? await prisma.$queryRaw(
        Prisma.sql`
          SELECT music_id, COUNT(*)::bigint AS votes
          FROM monthly_top_track_votes
          WHERE month_key = ${monthKey}
            AND music_id IN (${Prisma.join(displayIds.map((id) => BigInt(id)))})
          GROUP BY music_id
        `,
      )
    : [];

  const voteMap = new Map(voteRows.map((row) => [toNumber(row.music_id), toNumber(row.votes)]));
  const totalVotes = Array.from(voteMap.values()).reduce((sum, count) => sum + Number(count || 0), 0);
  const orderedTracks = orderTracksByIds(rows.map(mapTrack), displayIds);
  const visibleItems = orderedTracks
    .filter((track) => candidateIds.includes(Number(track.id)))
    .slice(0, 10)
    .map((track) => {
      const voteCount = Number(voteMap.get(Number(track.id)) || 0);
      return {
        ...track,
        vote_count: voteCount,
        vote_percent: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 1000) / 10 : 0,
        is_user_choice: Number(track.id) === userVoteMusicId,
      };
    });

  const selectedTrack = orderedTracks.find((track) => Number(track.id) === userVoteMusicId) || null;

  return {
    month_key: monthKey,
    total_votes: totalVotes,
    vote_enabled: voteEnabled,
    can_vote: voteEnabled && Boolean(candidateIds.length) && userVoteMusicId <= 0,
    items: visibleItems,
    user_vote: userVoteMusicId > 0
      ? {
          music_id: userVoteMusicId,
          created_at: userVoteRows[0]?.created_at instanceof Date ? userVoteRows[0].created_at.toISOString() : userVoteRows[0]?.created_at || null,
          track: selectedTrack,
        }
      : null,
  };
};

const searchTrackWhere = (query = "", filters = {}) => {
  const where = { isVisible: true };
  if (query) {
    where.OR = [
      { name: { contains: query } },
      {
        musicArtist: {
          some: {
            artist: {
              name: { contains: query },
            },
          },
        },
      },
    ];
  }

  if (filters.genreId) where.categoryId = BigInt(filters.genreId);
  if (filters.countryId) where.languageId = BigInt(filters.countryId);
  if (filters.yearId) where.yearId = BigInt(filters.yearId);
  if (filters.artistId) {
    where.musicArtist = {
      some: { artistId: BigInt(filters.artistId) },
    };
  }
  return where;
};

const getUserPlaylistsWithTracks = async (userId) => {
  const playlists = await prisma.playlist.findMany({
    where: { userId: BigInt(userId) },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      tracks: {
        where: {
          music: {
            isVisible: true,
          },
        },
        select: {
          music: {
            select: trackSelect,
          },
        },
      },
    },
  });

  const mapped = playlists.map((playlist) => ({
    id: toNumber(playlist.id),
    name: playlist.name,
    tracks: playlist.tracks
      .map((t) => t.music)
      .filter(Boolean)
      .map(mapTrack),
  }));

  return mapped;
};

export const libraryService = {
  async getHome(userId, { artistId, musicId }) {
    await ensureDisplayCounterSchema();
    const whereByArtist = {
      isVisible: true,
      ...(artistId ? { musicArtist: { some: { artistId: BigInt(artistId) } } } : {}),
    };
    const [baseTracks, topMonthTracks, top10VoteEnabled] = await Promise.all([
      prisma.music.findMany({
        where: whereByArtist,
        select: trackSelect,
        orderBy: [{ isPopular: "desc" }, { plays: "desc" }, { id: "desc" }],
        take: 30,
      }),
      getMonthlyTopTracks({ artistId, limit: 10 }),
      getTop10VoteEnabled(),
    ]);

    const selectedTrack = musicId
      ? await prisma.music.findFirst({
          where: { id: BigInt(musicId), isVisible: true },
          select: trackSelect,
        })
      : null;

    let tracks = baseTracks.map(mapTrack).slice(0, 10);
    if (!tracks.length && selectedTrack) {
      tracks = [mapTrack(selectedTrack)];
    }

    const artists = await prisma.artist.findMany({
      where: {
        isVisible: true,
        music: { some: { music: { isVisible: true } } },
      },
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
      take: 20,
      select: artistSelect,
    });

    const newReleases = await prisma.music.findMany({
      where: { isVisible: true },
      select: trackSelect,
      orderBy: { id: "desc" },
      take: 15,
    });

    const categories = await prisma.category.findMany({
      where: {
        tracks: {
          some: {
            isVisible: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        _count: { select: { tracks: true } },
      },
      orderBy: { tracks: { _count: "desc" } },
      take: 3,
    });

    const popularGenres = await Promise.all(
      categories.map(async (category) => {
        const genreTracks = await prisma.music.findMany({
          where: { categoryId: category.id, isVisible: true },
          select: trackSelect,
          orderBy: { id: "desc" },
          take: 8,
        });
        return {
          id: toNumber(category.id),
          name: category.name,
          musics_count: category._count.tracks,
          tracks: genreTracks.map(mapTrack),
        };
      }),
    );

    const playlists = userId ? await getUserPlaylistsWithTracks(userId) : [];
    const banners = await prisma.homeBanner.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        url: true,
        imagePath: true,
        imageUrl: true,
      },
    });
    const banner = banners[0] || null;
    return {
      featured_track: tracks.find((track) => track.id === Number(musicId)) || tracks[0] || null,
      tracks,
      top_month_tracks: topMonthTracks,
      top10_vote_enabled: top10VoteEnabled,
      popular_artists: artists.map(mapArtist),
      new_releases: newReleases.map(mapTrack),
      popular_genres: popularGenres,
      playlists: playlists.map(({ tracks: _tracks, ...p }) => p),
      active_playlist: playlists[0] || null,
      selected_artist_id: Number(artistId || 0),
      selected_music_id: Number(musicId || 0),
      home_banner: banner
        ? {
            id: toNumber(banner.id),
            title: banner.title,
            subtitle: banner.subtitle,
            url: banner.url,
            image_url: banner.imagePath ? resolveStorageUrl(banner.imagePath) : banner.imageUrl,
          }
        : null,
      home_banners: banners.map((item) => ({
        id: toNumber(item.id),
        title: item.title,
        subtitle: item.subtitle,
        url: item.url,
        image_url: item.imagePath ? resolveStorageUrl(item.imagePath) : item.imageUrl,
      })),
    };
  },

  async getAlbumData({ artistId, musicId }) {
    await ensureDisplayCounterSchema();
    let selectedArtistId = Number(artistId || 0);
    let selectedMusic = null;

    if (musicId) {
      selectedMusic = await prisma.music.findFirst({
        where: { id: BigInt(musicId), isVisible: true },
        select: trackSelect,
      });
      if (!selectedArtistId && selectedMusic?.musicArtist?.[0]?.artistId) {
        selectedArtistId = toNumber(selectedMusic.musicArtist[0].artistId);
      }
    }

    const where = selectedArtistId
      ? { isVisible: true, musicArtist: { some: { artistId: BigInt(selectedArtistId) } } }
      : { isVisible: true };
    const albumTracks = await prisma.music.findMany({
      where,
      select: trackSelect,
      orderBy: { id: "desc" },
      take: 12,
    });
    const selectedArtist = selectedArtistId
      ? await prisma.artist.findFirst({
          where: { id: BigInt(selectedArtistId), isVisible: true },
          select: {
            id: true,
            photoPath: true,
          },
        })
      : null;
    const mappedTracks = albumTracks.map(mapTrack).filter(Boolean);
    const fallbackFeatured = mapTrack(selectedMusic || albumTracks[0] || null);
    const featured = mappedTracks.find((track) => track.id === Number(musicId)) || fallbackFeatured;
    const heroCover = selectedArtist?.photoPath ? resolveStorageUrl(selectedArtist.photoPath) : featured?.cover_url || "";

    return {
      featured: featured?.id ? { ...featured, hero_cover_url: heroCover } : null,
      tracks: mappedTracks,
      lock_album_cover: Boolean(selectedArtistId),
      artist_id: selectedArtistId,
      music_id: Number(musicId || 0),
      hero_cover_url: heroCover,
    };
  },

  async listTracks({ q, genreId, countryId, yearId, artistId, page = 1, pageSize = 60 }) {
    await ensureDisplayCounterSchema();
    const where = searchTrackWhere(q, { genreId, countryId, yearId, artistId });
    const skip = (Math.max(1, Number(page)) - 1) * Number(pageSize);
    const take = Math.max(1, Number(pageSize));

    const [rows, total] = await Promise.all([
      prisma.music.findMany({
        where,
        select: trackSelect,
        orderBy: [{ isPopular: "desc" }, { plays: "desc" }, { id: "desc" }],
        skip,
        take,
      }),
      prisma.music.count({ where }),
    ]);

    return {
      items: rows.map(mapTrack),
      meta: {
        page: Number(page),
        page_size: take,
        total,
        total_pages: Math.max(1, Math.ceil(total / take)),
      },
    };
  },

  async getTrackById(id) {
    await ensureDisplayCounterSchema();
    const row = await prisma.music.findFirst({
      where: { id: BigInt(id), isVisible: true },
      select: trackSelect,
    });
    if (!row) {
      const error = new Error("Track not found");
      error.status = 404;
      throw error;
    }
    return mapTrack(row);
  },

  async incrementPlay(id) {
    await ensureMonthlyPlaysSchema();
    const currentMonthKey = getCurrentMonthKey();
    const row = await prisma.music.findFirst({
      where: { id: BigInt(id), isVisible: true },
      select: { id: true },
    });
    if (!row) {
      const error = new Error("Track not found");
      error.status = 404;
      throw error;
    }

    const [updated] = await prisma.$queryRaw(
      Prisma.sql`
        UPDATE music
        SET plays = plays + 1,
            monthly_plays = CASE
              WHEN monthly_plays_month_key = ${currentMonthKey} THEN monthly_plays + 1
              ELSE 1
            END,
            monthly_plays_month_key = ${currentMonthKey},
            updated_at = NOW()
        WHERE id = ${row.id}
          AND is_visible = true
        RETURNING id, plays, monthly_plays
      `,
    );

    return {
      music_id: toNumber(updated.id),
      plays: toNumber(updated.plays),
      monthly_plays: toNumber(updated.monthly_plays),
    };
  },

  async getTop10VoteData(userId) {
    return getTopTrackVoteSnapshot(userId);
  },

  async getTop10VoteStatus() {
    const enabled = await getTop10VoteEnabled();
    return { enabled };
  },

  async getSiteEffects() {
    const [seasonEffect, siteNotice] = await Promise.all([getSeasonEffect(), getSiteNotice()]);
    return {
      season_effect: seasonEffect,
      site_notice: siteNotice,
    };
  },

  async submitTop10Vote(userId, musicId) {
    await ensureMonthlyTopTrackVoteSchema();
    const voteEnabled = await getTop10VoteEnabled();

    const normalizedMusicId = Number(musicId || 0);
    if (!normalizedMusicId) {
      throw createHttpError("Track is required", 422, { music_id: ["music_id is required"] });
    }
    if (!voteEnabled) {
      throw createHttpError("Voting is disabled", 403, { vote: ["Voting is disabled"] });
    }

    const monthKey = getCurrentMonthKey();
    const candidateIds = await getMonthlyTopTrackIds({ limit: 10 });
    if (!candidateIds.length) {
      throw createHttpError("Top 10 is empty", 422, { vote: ["No tracks available for vote"] });
    }
    if (!candidateIds.includes(normalizedMusicId)) {
      throw createHttpError("Track is not available for vote", 422, { music_id: ["Track is not in current Top 10"] });
    }

    const existingRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT id
        FROM monthly_top_track_votes
        WHERE user_id = ${BigInt(userId)}
          AND month_key = ${monthKey}
        LIMIT 1
      `,
    );
    if (existingRows.length) {
      throw createHttpError("You already voted this month", 409, { vote: ["Monthly vote already submitted"] });
    }

    try {
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO monthly_top_track_votes (user_id, music_id, month_key)
          VALUES (${BigInt(userId)}, ${BigInt(normalizedMusicId)}, ${monthKey})
        `,
      );
    } catch (error) {
      const code = String(error?.code || "");
      const dbCode = String(error?.meta?.code || "");
      if (code === "P2002" || dbCode === "23505") {
        throw createHttpError("You already voted this month", 409, { vote: ["Monthly vote already submitted"] });
      }
      throw error;
    }

    return getTopTrackVoteSnapshot(userId);
  },

  async listArtists({ q }) {
    await ensureDisplayCounterSchema();
    const where = {
      isVisible: true,
      ...(q ? { name: { contains: q } } : {}),
    };

    const rows = await prisma.artist.findMany({
      where,
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
      select: {
        ...artistSelect,
        _count: { select: { music: true } },
      },
    });
    return rows.map((artist) => ({
      ...mapArtist(artist),
      musics_count: artist._count.music,
    }));
  },

  async getArtistsIndexData({ q = "" } = {}) {
    await ensureDisplayCounterSchema();
    const query = String(q || "").trim();
    const where = {
      isVisible: true,
      ...(query ? { name: { contains: query } } : {}),
    };

    const [artists, popularArtists] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy: { name: "asc" },
        select: {
          ...artistSelect,
          _count: { select: { music: true } },
        },
      }),
      prisma.artist.findMany({
        where: { isPopular: true, isVisible: true },
        orderBy: { name: "asc" },
        take: 30,
        select: artistSelect,
      }),
    ]);

    return {
      artists: artists.map((artist) => ({
        ...mapArtist(artist),
        musics_count: Number(artist._count?.music || 0),
      })),
      popular_artists: popularArtists.map(mapArtist),
      q: query,
    };
  },

  async getMusicsIndexData({ q = "" } = {}) {
    await ensureDisplayCounterSchema();
    const query = String(q || "").trim();
    const where = query ? searchTrackWhere(query, {}) : {};

    const monthlyTopIdsPromise = getMonthlyTopTrackIds({ limit: 30 });
    const [musics, popularMusics, autoPopularIds] = await Promise.all([
      prisma.music.findMany({
        where,
        select: trackSelect,
        orderBy: { id: "desc" },
      }),
      prisma.music.findMany({
        where: { isPopular: true, isVisible: true },
        select: trackSelect,
        orderBy: { id: "desc" },
        take: 30,
      }),
      monthlyTopIdsPromise,
    ]);

    const autoPopularMusics = autoPopularIds.length
      ? await prisma.music.findMany({
          where: {
            id: { in: autoPopularIds.map((id) => BigInt(id)) },
            isVisible: true,
          },
          select: trackSelect,
        })
      : [];

    return {
      musics: musics.map(mapTrack),
      popular_musics: popularMusics.map(mapTrack),
      auto_popular_musics: orderTracksByIds(autoPopularMusics.map(mapTrack), autoPopularIds),
      q: query,
    };
  },

  async getArtistById(id) {
    await ensureDisplayCounterSchema();
    const artist = await prisma.artist.findFirst({
      where: { id: BigInt(id), isVisible: true },
      select: {
        ...artistSelect,
        music: {
          where: {
            music: {
              isVisible: true,
            },
          },
          select: {
            music: {
              select: trackSelect,
            },
          },
        },
      },
    });
    if (!artist) {
      const error = new Error("Artist not found");
      error.status = 404;
      throw error;
    }
    return {
      ...mapArtist(artist),
      tracks: artist.music.map((item) => mapTrack(item.music)),
    };
  },

  async listCategories() {
    const rows = await prisma.category.findMany({
      where: {
        tracks: {
          some: {
            isVisible: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        _count: { select: { tracks: true } },
      },
      orderBy: { name: "asc" },
    });
    return rows.map((row) => ({
      id: toNumber(row.id),
      name: row.name,
      musics_count: row._count.tracks,
    }));
  },

  async getFilters() {
    const [genres, countries, years, artists] = await Promise.all([
      prisma.category.findMany({
        where: {
          tracks: {
            some: {
              isVisible: true,
            },
          },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.language.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.year.findMany({
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
        },
      }),
      prisma.artist.findMany({
        where: {
          isVisible: true,
          music: {
            some: {
              music: {
                isVisible: true,
              },
            },
          },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    return {
      genres: genres.map((g) => ({ id: toNumber(g.id), name: g.name })),
      countries: countries.map((c) => ({ id: toNumber(c.id), name: c.name })),
      years: years.map((y) => ({ id: toNumber(y.id), date: y.date })),
      artists: artists.map((artist) => ({ id: toNumber(artist.id), name: artist.name })),
    };
  },

  async getSubscriptionSummary(userId) {
    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
    const playlistsCount = await prisma.playlist.count({ where: { userId: BigInt(userId) } });
    const plan = normalizePlan(user);
    const features = getPlanFeatures(plan);
    const plusDownloads =
      plan === "plus" ? await resolvePlusDownloadState(userId, user, { persist: true }) : null;
    const downloadsUsed = plusDownloads ? plusDownloads.used : Number(user?.downloadsUsedMonth || 0);
    const playlistLimit = features.playlistLimit;
    const monthlyDownloadLimit = features.monthlyDownloadLimit;

    return {
      plan,
      features: {
        playlist_limit: playlistLimit,
        unlimited_playlists: playlistLimit == null,
        can_download: features.canDownload,
        monthly_download_limit: monthlyDownloadLimit,
        unlimited_downloads: features.unlimitedDownloads,
      },
      stats: {
        playlists_count: playlistsCount,
        playlists_left: playlistLimit == null ? null : Math.max(0, playlistLimit - playlistsCount),
        playlists_over_limit: playlistLimit == null ? false : playlistsCount > playlistLimit,
        downloads_used: downloadsUsed,
        downloads_left: monthlyDownloadLimit == null ? null : Math.max(0, monthlyDownloadLimit - downloadsUsed),
        month_start: plusDownloads?.monthStart ? plusDownloads.monthStart.toISOString().slice(0, 10) : null,
        month_end: plusDownloads?.monthEnd ? plusDownloads.monthEnd.toISOString().slice(0, 10) : null,
      },
    };
  },

  async updateSubscription(userId, plan) {
    const normalizedPlan = String(plan || "").trim().toLowerCase();
    if (!["free", "plus", "premium"].includes(normalizedPlan)) {
      const error = new Error("Invalid plan");
      error.status = 422;
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
    const updatePayload = {
      subscriptionPlan: normalizedPlan,
      subscribes: normalizedPlan !== "free",
    };
    if (normalizedPlan === "plus" && normalizePlan(user) !== "plus") {
      updatePayload.downloadsMonthStartsAt = new Date();
      updatePayload.downloadsUsedMonth = 0;
    }
    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: updatePayload,
    });
    return this.getSubscriptionSummary(userId);
  },

  async getDownloadInfo(musicId, userId) {
    const [music, user] = await Promise.all([
      prisma.music.findFirst({ where: { id: BigInt(musicId), isVisible: true }, select: trackSelect }),
      prisma.user.findUnique({ where: { id: BigInt(userId) } }),
    ]);
    if (!music) {
      const error = new Error("Track not found");
      error.status = 404;
      throw error;
    }

    const plan = normalizePlan(user);
    if (plan === "free") {
      const error = new Error("Download is not available on free plan");
      error.status = 403;
      throw error;
    }

    if (!music.audioPath) {
      const error = new Error("Audio file is missing");
      error.status = 404;
      throw error;
    }

    if (plan === "plus") {
      const plusState = await resolvePlusDownloadState(userId, user, { persist: true });
      const used = plusState.used;
      if (used >= 30) {
        const error = new Error("Plus monthly download limit reached");
        error.status = 429;
        throw error;
      }
      await prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
          downloadsUsedMonth: used + 1,
          downloadsMonthStartsAt: plusState.monthStart,
        },
      });
    }

    return {
      track: mapTrack(music),
      download_url: resolveStorageUrl(music.audioPath),
      filename: `${music.name || "track"}.mp3`,
    };
  },

  async markMusicPopular(id, popular) {
    const row = await prisma.music.update({
      where: { id: BigInt(id) },
      data: { isPopular: Boolean(popular) },
      select: trackSelect,
    });
    return mapTrack(row);
  },

  async markArtistPopular(id, popular) {
    const row = await prisma.artist.update({
      where: { id: BigInt(id) },
      data: { isPopular: Boolean(popular) },
      select: artistSelect,
    });
    return mapArtist(row);
  },
};
