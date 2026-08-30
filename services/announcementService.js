import Announcement from "../models/Announcement.js";
import { isMongoAvailable } from "../config/db.js";

const memoryAnnouncements = {};

// Get all announcements for a specific station (newest first)
export async function getAnnouncementsForStation(stationId) {
  if (!isMongoAvailable()) {
    return [...(memoryAnnouncements[stationId] || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  return await Announcement.find({ stationId }).sort({ createdAt: -1 }).lean();
}

// Create a new announcement for a station
export async function createAnnouncement(stationId, text) {
  if (!isMongoAvailable()) {
    const item = {
      _id: `memory-${Date.now()}`,
      stationId,
      text,
      createdAt: new Date().toISOString(),
    };

    if (!memoryAnnouncements[stationId]) {
      memoryAnnouncements[stationId] = [];
    }

    memoryAnnouncements[stationId].unshift(item);
    return item;
  }

  const doc = await Announcement.create({ stationId, text });
  return doc.toObject();
}
