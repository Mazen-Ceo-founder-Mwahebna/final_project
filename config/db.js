// Import packages we need
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables from .env file
dotenv.config();

let mongoAvailable = false;

export function isMongoAvailable() {
  return mongoAvailable;
}

export function setMongoAvailable(value) {
  mongoAvailable = value;
}

// Function to connect to MongoDB database
export async function connectDB() {
  // Get MongoDB connection URL from environment variables
  const url = process.env.MONGO_URL || "mongodb://localhost:27017/metrosync-live";

  try {
    // Try to connect to MongoDB
    await mongoose.connect(url);
    mongoAvailable = true;
    console.log("MongoDB connected");
    return true;
  } catch (err) {
    mongoAvailable = false;
    console.warn(
      "MongoDB unavailable. Running in local fallback mode without a database.",
      err.message
    );
    return false;
  }
}
