// Import all shared utilities
import {
  appState,
  handleStationChange,
  initializeTrain,
  loadStationsWithPreload,
  populateStationDropdown,
  renderMap,
  setupSocketListeners,
  startClientSideTrainAnimation,
} from "./shared-utils.js";

// Connect to Socket.IO server for real-time updates
const socket = io();

// Get HTML elements
const stationSelect = document.getElementById("station-select");
const stationTitle = document.getElementById("station-title");
const mapTitle = document.getElementById("map-title");
const mapLine = document.getElementById("map-line");
const announcementList = document.getElementById("announcement-list");
const viewersText = document.getElementById("viewers-text");

// Load and initialize everything
async function init() {
  // Load stations from server (or use preloaded data)
  appState.stations = await loadStationsWithPreload();

  // Populate dropdown with stations
  populateStationDropdown(stationSelect);

  // Draw station dots on map
  renderMap(mapLine);

  // Create train and start animation
  initializeTrain(mapLine);
  startClientSideTrainAnimation();

  // Setup socket listeners for announcements and viewer counts
  setupSocketListeners(socket, announcementList, viewersText);
}

// When user selects a station from dropdown
stationSelect.addEventListener("change", async (e) => {
  const handler = handleStationChange(
    socket,
    e.target.value,
    [stationTitle, mapTitle], // Elements to update with station name
    announcementList,
    mapLine
  );
  await handler();
});

// Start the app
init();
