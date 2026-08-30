import mongoose from "mongoose";

// Define structure for Announcement documents in database
const announcementSchema = new mongoose.Schema({
  stationId: { type: String, required: true }, // Which station is this for
  text: { type: String, required: true }, // The announcement message
  createdAt: { type: Date, default: Date.now }, // When it was created
});

// Export Announcement model (creates "announcements" collection)
export default mongoose.models.Announcement ||
  mongoose.model("Announcement", announcementSchema);
