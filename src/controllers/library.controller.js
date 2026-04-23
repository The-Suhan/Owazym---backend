import { libraryService } from "../services/library.service.js";
import { ok } from "../utils/response.js";

export const libraryController = {
  async home(req, res, next) {
    try {
      const data = await libraryService.getHome(req.user?.id, {
        artistId: req.query.artist_id,
        musicId: req.query.music_id,
      });
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async albumData(req, res, next) {
    try {
      const data = await libraryService.getAlbumData({
        artistId: req.query.artist_id,
        musicId: req.query.music_id || req.params.id,
      });
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async tracks(req, res, next) {
    try {
      const data = await libraryService.listTracks({
        q: String(req.query.q || "").trim(),
        genreId: req.query.genre_id,
        countryId: req.query.country_id,
        yearId: req.query.year_id,
        artistId: req.query.artist_id,
        page: req.query.page,
      });
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async trackById(req, res, next) {
    try {
      const data = await libraryService.getTrackById(req.params.id);
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async incrementPlay(req, res, next) {
    try {
      const data = await libraryService.incrementPlay(req.params.id);
      return ok(res, data, "Play count incremented");
    } catch (error) {
      return next(error);
    }
  },

  async downloadTrack(req, res, next) {
    try {
      const data = await libraryService.getDownloadInfo(req.params.id, req.user.id);
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async top10Vote(req, res, next) {
    try {
      const data = await libraryService.getTop10VoteData(req.user.id);
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async top10VoteStatus(_req, res, next) {
    try {
      const data = await libraryService.getTop10VoteStatus();
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async siteEffects(_req, res, next) {
    try {
      const data = await libraryService.getSiteEffects();
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async submitTop10Vote(req, res, next) {
    try {
      const data = await libraryService.submitTop10Vote(req.user.id, req.body.music_id);
      return ok(res, data, "Vote submitted");
    } catch (error) {
      return next(error);
    }
  },

  async artists(req, res, next) {
    try {
      const data = await libraryService.listArtists({ q: String(req.query.q || "").trim() });
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async artistsIndex(req, res, next) {
    try {
      const data = await libraryService.getArtistsIndexData({ q: String(req.query.q || "").trim() });
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async artistById(req, res, next) {
    try {
      const data = await libraryService.getArtistById(req.params.id);
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async categories(_req, res, next) {
    try {
      const data = await libraryService.listCategories();
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async musicsIndex(req, res, next) {
    try {
      const data = await libraryService.getMusicsIndexData({ q: String(req.query.q || "").trim() });
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async search(req, res, next) {
    try {
      const list = await libraryService.listTracks({
        q: String(req.query.q || "").trim(),
        genreId: req.query.genre_id,
        countryId: req.query.country_id,
        yearId: req.query.year_id,
        artistId: req.query.artist_id,
        page: req.query.page,
      });
      const filters = await libraryService.getFilters();
      return ok(res, { ...list, ...filters });
    } catch (error) {
      return next(error);
    }
  },

  async subscriptionSummary(req, res, next) {
    try {
      const data = await libraryService.getSubscriptionSummary(req.user.id);
      return ok(res, data);
    } catch (error) {
      return next(error);
    }
  },

  async updateSubscription(req, res, next) {
    try {
      const data = await libraryService.updateSubscription(req.user.id, String(req.body.plan || ""));
      return ok(res, data, "Subscription updated");
    } catch (error) {
      return next(error);
    }
  },

  async markMusicPopular(req, res, next) {
    try {
      const data = await libraryService.markMusicPopular(req.params.id, true);
      return ok(res, data, "Track marked as popular");
    } catch (error) {
      return next(error);
    }
  },

  async unmarkMusicPopular(req, res, next) {
    try {
      const data = await libraryService.markMusicPopular(req.params.id, false);
      return ok(res, data, "Track removed from popular");
    } catch (error) {
      return next(error);
    }
  },

  async markArtistPopular(req, res, next) {
    try {
      const data = await libraryService.markArtistPopular(req.params.id, true);
      return ok(res, data, "Artist marked as popular");
    } catch (error) {
      return next(error);
    }
  },

  async unmarkArtistPopular(req, res, next) {
    try {
      const data = await libraryService.markArtistPopular(req.params.id, false);
      return ok(res, data, "Artist removed from popular");
    } catch (error) {
      return next(error);
    }
  },
};
