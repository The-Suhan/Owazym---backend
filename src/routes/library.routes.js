import { Router } from "express";
import { libraryController } from "../controllers/library.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.get("/home", libraryController.home);
router.get("/albums", libraryController.albumData);
router.get("/albums/:id", libraryController.albumData);
router.get("/artists", libraryController.artists);
router.get("/artists-index", libraryController.artistsIndex);
router.get("/artists/:id", libraryController.artistById);
router.get("/tracks", libraryController.tracks);
router.get("/tracks/:id", libraryController.trackById);
router.get("/musics-index", libraryController.musicsIndex);
router.get("/categories", libraryController.categories);
router.get("/search", libraryController.search);
router.get("/filters", libraryController.search);
router.get("/site-effects", libraryController.siteEffects);
router.get("/subscription", requireAuth, libraryController.subscriptionSummary);
router.post("/subscription", requireAuth, libraryController.updateSubscription);
router.get("/top10-vote", requireAuth, libraryController.top10Vote);
router.get("/top10-vote/status", requireAuth, libraryController.top10VoteStatus);
router.post("/top10-vote", requireAuth, libraryController.submitTop10Vote);

router.post("/tracks/:id/play", requireAuth, libraryController.incrementPlay);
router.get("/tracks/:id/download", requireAuth, libraryController.downloadTrack);

router.post("/admin/musics/:id/popular", requireAuth, requireAdmin, libraryController.markMusicPopular);
router.delete("/admin/musics/:id/popular", requireAuth, requireAdmin, libraryController.unmarkMusicPopular);
router.post("/admin/artists/:id/popular", requireAuth, requireAdmin, libraryController.markArtistPopular);
router.delete("/admin/artists/:id/popular", requireAuth, requireAdmin, libraryController.unmarkArtistPopular);

export default router;
