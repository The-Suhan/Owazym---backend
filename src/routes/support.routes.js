import { Router } from "express";
import { supportController } from "../controllers/support.controller.js";

const router = Router();

router.post("/support", supportController.sendMessage);

export default router;
