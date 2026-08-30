import mongoose from "mongoose";

// Define structure for Station documents in database
const stationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true, // No two stations can have same ID
    trim: true, // Remove spaces from start/end
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  line: {
    type: Number,
    required: true,
    min: 1, // Line number must be at least 1
  },
  order: {
    type: Number,
    required: true,
    min: 0, // Order starts from 0
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set when created
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Automatically set when updated
  },
});

// Export Station model (creates "stations" collection)
export default mongoose.models.Station ||
  mongoose.model("Station", stationSchema);
