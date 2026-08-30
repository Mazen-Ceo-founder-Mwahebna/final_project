import { getAllStations } from "../services/stationService.js";
import { getAnnouncementsForStation } from "../services/announcementService.js";

// GET /api/v1/stations - Get list of all stations
export async function listStations(req, res, next) {
  try {
    const stations = await getAllStations();
    return res.json(stations);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/stations/:id/announcements - Get all announcements for a station
export async function stationAnnouncements(req, res, next) {
  try {
    const { id } = req.params;
    const announcements = await getAnnouncementsForStation(id);
    return res.json(announcements);
  } catch (err) {
    next(err);
  }
}
