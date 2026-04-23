import { Router } from "express";
import path from "node:path";
import { promises as fs } from "node:fs";
import authRoutes from "./auth.routes.js";
import libraryRoutes from "./library.routes.js";
import playlistRoutes from "./playlist.routes.js";
import adminRoutes from "./admin.routes.js";
import supportRoutes from "./support.routes.js";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { libraryService } from "../services/library.service.js";
import { playlistService } from "../services/playlist.service.js";
import { env } from "../config/env.js";
import { ok } from "../utils/response.js";

const router = Router();

router.get("/health", (_req, res) => ok(res, { ok: true }, "API healthy"));
router.use("/api", authRoutes);
router.use("/api", libraryRoutes);
router.use("/api", supportRoutes);
router.use("/api/playlists", playlistRoutes);
router.use("/api/admin", adminRoutes);

// Legacy compatibility aliases for old Laravel JS flow
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/logout", requireAuth, async (_req, res) => {
  return res.json({ ok: true });
});
router.get("/user", requireAuth, async (req, res) => {
  return res.json({
    id: Number(req.user.id),
    name: req.user.name,
    subscription_plan: String(req.user.subscriptionPlan || (req.user.subscribes ? "premium" : "free") || "free").toLowerCase(),
  });
});

router.get("/home", async (req, res, next) => {
  try {
    const data = await libraryService.getHome(req.user?.id, {
      artistId: req.query.artist_id,
      musicId: req.query.music_id,
    });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const data = await libraryService.getHome(req.user?.id, {
      artistId: req.query.artist_id,
      musicId: req.query.music_id,
    });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get("/album-data", async (req, res, next) => {
  try {
    const data = await libraryService.getAlbumData({
      artistId: req.query.artist_id,
      musicId: req.query.music_id,
    });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const list = await libraryService.listTracks({
      q: String(req.query.q || "").trim(),
      genreId: req.query.genre_id,
      countryId: req.query.country_id,
      yearId: req.query.year_id,
      page: req.query.page,
    });
    const filters = await libraryService.getFilters();
    return res.json({ ...list, ...filters });
  } catch (error) {
    return next(error);
  }
});

router.post("/music/:id/play", requireAuth, async (req, res, next) => {
  try {
    const data = await libraryService.incrementPlay(req.params.id);
    return res.json({
      ok: true,
      music_id: Number(data.music_id || req.params.id),
      plays: Number(data.plays || 0),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/music/:id/download", requireAuth, async (req, res, next) => {
  try {
    const data = await libraryService.getDownloadInfo(req.params.id, req.user.id);
    const storagePath = String(data.track?.audio_url || data.download_url || "");
    const parsed = new URL(storagePath, `http://localhost:${env.port}`);
    const normalized = decodeURIComponent(parsed.pathname.replace(/^\/storage\/?/, ""));
    const absolute = path.resolve(env.storagePublicPath, normalized);

    await fs.access(absolute);
    return res.download(absolute, data.filename || "track.mp3");
  } catch (error) {
    return next(error);
  }
});

router.get("/playlists", requireAuth, async (req, res, next) => {
  try {
    const data = await playlistService.list(req.user.id);
    const compact = data.map((item) => ({ id: Number(item.id), name: String(item.name || "") }));
    return res.json(compact);
  } catch (error) {
    return next(error);
  }
});

router.post("/playlists", requireAuth, async (req, res, next) => {
  try {
    const data = await playlistService.create(req.user, req.body.name);
    return res.json({
      ok: true,
      playlist: data.playlist,
      created: Boolean(data.created),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/playlists/:id", requireAuth, async (req, res, next) => {
  try {
    const data = await playlistService.getOne(req.user.id, req.params.id);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

router.delete("/playlists/:id", requireAuth, async (req, res, next) => {
  try {
    await playlistService.remove(req.user.id, req.params.id);
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/playlist-tracks", requireAuth, async (req, res, next) => {
  try {
    const data = await playlistService.addTrack(req.user.id, req.body.playlist_id, req.body.music_id);
    return res.json({
      ok: true,
      added: Boolean(data.added),
      playlist_id: Number(data.playlist_id),
      playlist_name: data.playlist_name,
      music_id: Number(data.music_id),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/playlist-tracks", requireAuth, async (req, res, next) => {
  try {
    const data = await playlistService.removeTrack(req.user.id, req.body.playlist_id, req.body.music_id);
    return res.json({
      ok: true,
      removed: Boolean(data.removed),
      playlist_id: Number(data.playlist_id),
      music_id: Number(data.music_id),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
