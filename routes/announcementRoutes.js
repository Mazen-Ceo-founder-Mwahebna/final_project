import express from "express";
import { listAnnouncementsController } from "../controllers/announcementController.js";

const router = express.Router();

router.get("/", listAnnouncementsController);

export default router;
