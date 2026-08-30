import express from "express";
import { listStations, stationAnnouncements } from "../controllers/stationController.js";
import { createAnnouncementController } from "../controllers/announcementController.js";
import { requireAdmin } from "../middleware/middleware.auth.js";

// Create router for station routes
const router = express.Router();

// GET /api/v1/stations - Get all stations (anyone can access)
router.get("/", listStations);

// GET announcements for a station (anyone can access)
router.get("/:id/announcements", stationAnnouncements);

// POST new announcement (admin only)
router.post("/:id/announcements", requireAdmin, createAnnouncementController);

export default router;
