import { createAnnouncement } from "../services/announcementService.js";
import { getIo } from "../sockets/ioInstance.js";

// Handle creating new announcement
export async function createAnnouncementController(req, res, next) {
  try {
    const { id } = req.params;
    const { text } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Announcement text is required" });
    }

    const announcement = await createAnnouncement(id, text.trim());
    const io = getIo();

    if (io) {
      io.to(`station:${id}`).emit("announcement", announcement);
      io.to(`station:${id}`).emit("presenceUpdate", {
        stationId: id,
        watchers: io.sockets.adapter.rooms.get(`station:${id}`)?.size || 0,
      });
    }

    return res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
}
