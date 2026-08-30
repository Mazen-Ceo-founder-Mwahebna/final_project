import Station from "../models/Station.js";
import { isMongoAvailable } from "../config/db.js";

const memoryStations = [
  { id: "helwan", name: "Helwan", line: 1, order: 0 },
  { id: "ain-helwan", name: "Ain Helwan", line: 1, order: 1 },
  { id: "hadayek-helwan", name: "Hadayek Helwan", line: 1, order: 2 },
  { id: "maadi", name: "Maadi", line: 1, order: 10 },
  { id: "sadat", name: "Sadat", line: 1, order: 20 },
  { id: "shohadaa", name: "El-Shohadaa", line: 1, order: 25 },
  { id: "new-marg", name: "New Marg", line: 1, order: 35 },
];

// Get all stations from database, sorted by line and order
export async function getAllStations() {
  if (!isMongoAvailable()) {
    return [...memoryStations].sort((a, b) => a.line - b.line || a.order - b.order);
  }

  return await Station.find({}).sort({ line: 1, order: 1 }).lean();
}

// Add multiple stations at once (for initial setup)
export async function seedStations(stationsArray) {
  if (!isMongoAvailable()) {
    stationsArray.forEach((station) => {
      const index = memoryStations.findIndex((item) => item.id === station.id);
      if (index >= 0) {
        memoryStations[index] = { ...memoryStations[index], ...station };
      } else {
        memoryStations.push(station);
      }
    });

    return { upsertedCount: stationsArray.length, modifiedCount: 0 };
  }

  // Create operations to update or insert each station
  const operations = stationsArray.map((station) => ({
    updateOne: {
      filter: { id: station.id },
      update: { $set: station },
      upsert: true, // Create if doesn't exist
    },
  }));

  // Execute all operations at once
  return await Station.bulkWrite(operations);
}
