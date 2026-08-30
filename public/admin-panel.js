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

// Check if admin is logged in
function checkAuth() {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    // No token found, redirect to login page
    window.location.href = "/";
    return null;
  }
  return token;
}

// Get token or redirect to login
const token = checkAuth();
if (!token) {
  throw new Error("Not authenticated");
}

// Connect to Socket.IO for real-time updates
const socket = io();

// Get HTML elements
const stationSelect = document.getElementById("admin-station-select");
const adminStationTitle = document.getElementById("admin-station-title");
const adminMapTitle = document.getElementById("map-title");
const mapLine = document.getElementById("admin-map-line");
const announcementList = document.getElementById("admin-announcement-list");
const viewersText = document.getElementById("admin-viewers-text");
const announcementForm = document.getElementById("announcement-form");
const announcementText = document.getElementById("announcement-text");
const announcementError = document.getElementById("announcement-error");

// Load and initialize everything
async function init() {
  // Load stations from server (or use preloaded data) with auth token
  appState.stations = await loadStationsWithPreload(token);

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

// When admin selects a station
stationSelect.addEventListener("change", async (e) => {
  const handler = handleStationChange(
    socket,
    e.target.value,
    [adminStationTitle, adminMapTitle], // Elements to update with station name
    announcementList,
    mapLine,
    token // Pass token for authenticated requests
  );
  await handler();
});

// When admin submits new announcement
announcementForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  announcementError.textContent = "";

  // Check if station is selected
  if (!appState.currentStationId) {
    announcementError.textContent = "Choose a station first.";
    return;
  }

  // Check if text is provided
  const text = announcementText.value.trim();
  if (!text) {
    announcementError.textContent = "Announcement text is required.";
    return;
  }

  try {
    // Send announcement to server
    const res = await fetch(
      `/api/v1/stations/${appState.currentStationId}/announcements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ text }),
      }
    );

    // Check if request failed
    if (!res.ok) {
      const body = await res.json();
      announcementError.textContent =
        body.message || "Failed to create announcement";
      return;
    }

    // Success! Clear the text box
    announcementText.value = "";
  } catch (err) {
    announcementError.textContent = "Network error";
  }
});

// Start the app
init();
