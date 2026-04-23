import { playlistService } from "../services/playlist.service.js";
import { ok } from "../utils/response.js";

export const playlistController = {
  async list(req, res, next) {
    try {
      const data = await playlistService.list(req.user.id);
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async one(req, res, next) {
    try {
      const data = await playlistService.getOne(req.user.id, req.params.id);
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async create(req, res, next) {
    try {
      const data = await playlistService.create(req.user, req.body.name);
      return ok(res, data, data.created ? "Playlist created" : "Playlist already exists");
    } catch (error) {
      return next(error);
    }
  },

  async remove(req, res, next) {
    try {
      await playlistService.remove(req.user.id, req.params.id);
      return ok(res, null, "Playlist deleted");
    } catch (error) {
      return next(error);
    }
  },

  async addTrack(req, res, next) {
    try {
      const { playlist_id, music_id } = req.body;
      const data = await playlistService.addTrack(req.user.id, playlist_id, music_id);
      return ok(res, data, data.added ? "Track added to playlist" : "Track already exists in playlist");
    } catch (error) {
      return next(error);
    }
  },

  async removeTrack(req, res, next) {
    try {
      const { playlist_id, music_id } = req.body;
      const data = await playlistService.removeTrack(req.user.id, playlist_id, music_id);
      return ok(res, data, data.removed ? "Track removed from playlist" : "Track not found in playlist");
    } catch (error) {
      return next(error);
    }
  },
};
