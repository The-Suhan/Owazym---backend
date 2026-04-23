import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/sms", adminController.listSms);
router.post("/sms/:id/read", adminController.markSmsRead);
router.delete("/sms/:id", adminController.deleteSms);
router.get("/create-data", adminController.createData);
router.post("/artists", adminController.createArtist);
router.put("/artists/:id", adminController.updateArtist);
router.post("/artists/:id/popular", adminController.addArtistPopular);
router.delete("/artists/:id/popular", adminController.removeArtistPopular);
router.post("/artists/:id/hide", adminController.hideArtist);
router.post("/artists/:id/show", adminController.showArtist);
router.put("/artists/:id/display-listeners", adminController.setArtistDisplayListeners);
router.post("/artists/:id/track-banner", adminController.publishArtistTrackBanner);
router.post("/categories", adminController.createCategory);
router.post("/musics", adminController.createMusic);
router.post("/musics/:id/popular", adminController.addMusicPopular);
router.delete("/musics/:id/popular", adminController.removeMusicPopular);
router.put("/musics/:id/display-plays", adminController.setMusicDisplayPlays);
router.put("/top10-vote/enabled", adminController.setTop10VoteEnabled);
router.put("/season-effect", adminController.setSeasonEffect);
router.post("/banner", adminController.upsertBanner);
router.delete("/banner/:id", adminController.deleteBanner);
router.delete("/artists/:id", adminController.deleteArtist);
router.delete("/categories/:id", adminController.deleteCategory);
router.delete("/musics/:id", adminController.deleteMusic);

export default router;
