import { prisma } from "../config/prisma.js";
import { toNumber } from "../utils/serialize.js";
import { fallbackCover, resolveStorageUrl } from "../utils/covers.js";

const normalizePlan = (user) => {
  const plan = String(user?.subscriptionPlan || "").toLowerCase();
  if (["free", "plus", "premium"].includes(plan)) return plan;
  return user?.subscribes ? "premium" : "free";
};

export const playlistService = {
  async list(userId) {
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
              select: {
                id: true,
                name: true,
                audioPath: true,
                coverPath: true,
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
            },
          },
        },
      },
    });

    return playlists.map((playlist) => ({
      id: toNumber(playlist.id),
      name: playlist.name,
      tracks: playlist.tracks
        .map((t) => t.music)
        .filter(Boolean)
        .map((music) => ({
          id: toNumber(music.id),
          name: music.name,
          artist: (music.musicArtist || []).map((item) => item.artist?.name).filter(Boolean).join(", "),
          audio_url: resolveStorageUrl(music.audioPath),
          cover_url: music.coverPath ? resolveStorageUrl(music.coverPath) : fallbackCover(music.id, music.name),
        })),
    }));
  },

  async getOne(userId, playlistId) {
    const playlist = await prisma.playlist.findFirst({
      where: { id: BigInt(playlistId), userId: BigInt(userId) },
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
              select: {
                id: true,
                name: true,
                audioPath: true,
                coverPath: true,
                year: {
                  select: {
                    date: true,
                  },
                },
                category: {
                  select: {
                    name: true,
                  },
                },
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
            },
          },
        },
      },
    });
    if (!playlist) {
      const error = new Error("Playlist not found");
      error.status = 404;
      throw error;
    }

    return {
      id: toNumber(playlist.id),
      name: playlist.name,
      tracks: playlist.tracks
        .map((row) => row.music)
        .filter(Boolean)
        .map((music) => ({
          id: toNumber(music.id),
          name: music.name,
          artist: (music.musicArtist || []).map((item) => item.artist?.name).filter(Boolean).join(", "),
          year: music.year?.date || null,
          category: music.category?.name || null,
          audio_url: resolveStorageUrl(music.audioPath),
          cover_url: music.coverPath ? resolveStorageUrl(music.coverPath) : fallbackCover(music.id, music.name),
        })),
    };
  },

  async create(user, name) {
    const plan = normalizePlan(user);
    const maxPlaylists = plan === "free" ? 1 : plan === "plus" ? 5 : null;
    const playlistName = String(name || "").trim();
    if (!playlistName) {
      const error = new Error("Playlist name is required");
      error.status = 422;
      throw error;
    }

    const existing = await prisma.playlist.findFirst({
      where: { userId: BigInt(user.id), name: playlistName },
    });
    if (existing) {
      return {
        created: false,
        playlist: { id: toNumber(existing.id), name: existing.name },
      };
    }

    if (maxPlaylists !== null) {
      const count = await prisma.playlist.count({ where: { userId: BigInt(user.id) } });
      if (count >= maxPlaylists) {
        const error = new Error(`Playlist limit reached for ${plan} plan`);
        error.status = 422;
        throw error;
      }
    }

    const created = await prisma.playlist.create({
      data: {
        name: playlistName,
        userId: BigInt(user.id),
      },
    });
    return {
      created: true,
      playlist: { id: toNumber(created.id), name: created.name },
    };
  },

  async remove(userId, playlistId) {
    const playlist = await prisma.playlist.findFirst({
      where: { id: BigInt(playlistId), userId: BigInt(userId) },
    });
    if (!playlist) {
      const error = new Error("Playlist not found");
      error.status = 404;
      throw error;
    }

    await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });
    await prisma.playlist.delete({ where: { id: playlist.id } });
    return true;
  },

  async addTrack(userId, playlistId, musicId) {
    const playlist = await prisma.playlist.findFirst({
      where: { id: BigInt(playlistId), userId: BigInt(userId) },
    });
    if (!playlist) {
      const error = new Error("Playlist not found");
      error.status = 404;
      throw error;
    }

    const exists = await prisma.playlistTrack.findFirst({
      where: { playlistId: playlist.id, musicId: BigInt(musicId) },
    });
    if (exists) {
      return {
        added: false,
        playlist_id: toNumber(playlist.id),
        playlist_name: playlist.name,
        music_id: Number(musicId),
      };
    }

    await prisma.playlistTrack.create({
      data: {
        playlistId: playlist.id,
        musicId: BigInt(musicId),
      },
    });
    return {
      added: true,
      playlist_id: toNumber(playlist.id),
      playlist_name: playlist.name,
      music_id: Number(musicId),
    };
  },

  async removeTrack(userId, playlistId, musicId) {
    const playlist = await prisma.playlist.findFirst({
      where: { id: BigInt(playlistId), userId: BigInt(userId) },
    });
    if (!playlist) {
      const error = new Error("Playlist not found");
      error.status = 404;
      throw error;
    }

    const removed = await prisma.playlistTrack.deleteMany({
      where: {
        playlistId: playlist.id,
        musicId: BigInt(musicId),
      },
    });
    return {
      removed: removed.count > 0,
      playlist_id: toNumber(playlist.id),
      music_id: Number(musicId),
    };
  },
};
