// Script to add initial stations to database
// Run this once: npm start seed

import { connectDB } from "../config/db.js";
import { seedStations } from "../services/stationService.js";

// Initial list of stations to add
const initialStations = [
  { id: "helwan", name: "Helwan", line: 1, order: 0 },
  { id: "ain-helwan", name: "Ain Helwan", line: 1, order: 1 },
  { id: "hadayek-helwan", name: "Hadayek Helwan", line: 1, order: 2 },
  { id: "maadi", name: "Maadi", line: 1, order: 10 },
  { id: "sadat", name: "Sadat", line: 1, order: 20 },
  { id: "shohadaa", name: "El-Shohadaa", line: 1, order: 25 },
  { id: "new-marg", name: "New Marg", line: 1, order: 35 },
];

// Main seeding function
async function seed() {
  try {
    // Connect to database first
    await connectDB();
    console.log("Seeding stations...");

    // Add all stations to database
    const result = await seedStations(initialStations);

    // Show success message with number of stations added
    console.log(
      `✓ Successfully seeded ${
        result.upsertedCount + result.modifiedCount
      } stations`
    );

    // Exit the program successfully
    process.exit(0);
  } catch (error) {
    // If something went wrong, show error and exit
    console.error("Error seeding stations:", error);
    process.exit(1);
  }
}

// Run the seeding function
seed();
