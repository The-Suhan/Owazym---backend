import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/user", requireAuth, authController.me);
router.post("/logout", requireAuth, authController.logout);

export default router;
