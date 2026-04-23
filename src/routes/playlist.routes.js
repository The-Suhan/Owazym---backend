import { Router } from "express";
import { playlistController } from "../controllers/playlist.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", playlistController.list);
router.post("/", playlistController.create);
router.post("/tracks", playlistController.addTrack);
router.delete("/tracks", playlistController.removeTrack);
router.get("/:id", playlistController.one);
router.delete("/:id", playlistController.remove);

export default router;
