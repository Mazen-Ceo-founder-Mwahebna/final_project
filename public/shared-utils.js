// ===== SHARED UTILITIES FOR PASSENGER AND ADMIN =====
// This file contains all the common code used by both pages

// Train animation timing configuration
export const TRAIN_CONFIG = {
  STOP_TIME: 3000, // Stop at each station for 3 seconds
  MOVE_TIME: 12000, // Move between stations in 12 seconds
};

// Shared app state
export const appState = {
  stations: [],
  currentStationId: null,
  currentTrainStationId: null,
  trainElement: null,
  currentTrainIndex: 0,
  isMovingForward: true,
};

// Move train to a specific station position
export function updateTrainPosition(index, isMoving = false) {
  if (appState.stations.length === 0) return;

  // Calculate position as percentage (0% to 100%)
  const trainPosition = (index / (appState.stations.length - 1)) * 100;

  // If moving, use smooth animation, otherwise jump instantly
  if (isMoving) {
    appState.trainElement.style.transition = `left ${
      TRAIN_CONFIG.MOVE_TIME / 1000
    }s ease-in-out`;
  } else {
    appState.trainElement.style.transition = "none";
  }

  // Move train to calculated position
  appState.trainElement.style.left = `calc(${trainPosition}% - 24px)`;
  appState.currentTrainIndex = index;
  appState.currentTrainStationId = appState.stations[index].id;
}

// Start the train animation loop
export function startClientSideTrainAnimation() {
  if (appState.stations.length === 0) return;

  const moveToNextStation = () => {
    // Train is stopped at current station
    updateTrainPosition(appState.currentTrainIndex, false);

    // Wait at the station
    setTimeout(() => {
      // Decide where train goes next
      if (appState.isMovingForward) {
        // Going forward
        if (appState.currentTrainIndex < appState.stations.length - 1) {
          appState.currentTrainIndex++; // Move to next station
        } else {
          // Reached last station, turn around
          appState.isMovingForward = false;
          appState.currentTrainIndex--;
        }
      } else {
        // Going backward
        if (appState.currentTrainIndex > 0) {
          appState.currentTrainIndex--; // Move to previous station
        } else {
          // Reached first station, turn around
          appState.isMovingForward = true;
          appState.currentTrainIndex++;
        }
      }

      // Start moving train to next station
      updateTrainPosition(appState.currentTrainIndex, true);

      // Wait for movement to finish, then repeat
      setTimeout(moveToNextStation, TRAIN_CONFIG.MOVE_TIME);
    }, TRAIN_CONFIG.STOP_TIME);
  };

  // Start the animation loop
  moveToNextStation();
}

// Draw all station dots on the map
export function renderMap(mapLine) {
  // Remove old station dots
  const existingDots = mapLine.querySelectorAll(".station-dot");
  existingDots.forEach((dot) => dot.remove());

  // Create new dots for each station
  appState.stations.forEach((s, index) => {
    const dot = document.createElement("div");

    // Highlight selected station with "selected" class
    dot.className =
      "station-dot" + (s.id === appState.currentStationId ? " selected" : "");
    dot.dataset.id = s.id;
    dot.dataset.index = index;

    // Add station name label
    const label = document.createElement("span");
    label.textContent = s.name;
    dot.appendChild(label);

    mapLine.appendChild(dot);
  });
}

// Create and initialize the train element
export function initializeTrain(mapLine) {
  if (!appState.trainElement) {
    appState.trainElement = document.createElement("div");
    appState.trainElement.className = "train-icon";
    appState.trainElement.textContent = "🚆";
    mapLine.appendChild(appState.trainElement);
  }

  // Start train at first station
  appState.currentTrainIndex = 0;
  updateTrainPosition(0, false);
}

// Populate station dropdown with options
export function populateStationDropdown(selectElement) {
  selectElement.innerHTML =
    "<option value=''>Select Station</option>" +
    appState.stations
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join("");
}

// Get announcements for a specific station
export async function loadAnnouncements(stationId, token = null) {
  const headers = token ? { Authorization: "Bearer " + token } : {};
  const res = await fetch(`/api/v1/stations/${stationId}/announcements`, {
    headers,
  });
  return await res.json();
}

// Add one announcement to the list
export function addAnnouncementToList(
  announcementList,
  announcement,
  toTop = false
) {
  const li = document.createElement("li");
  li.className = "announcement-item";

  // Format time nicely
  const time = new Date(announcement.createdAt || Date.now());
  li.innerHTML = `
    <div>${announcement.text}</div>
    <time>${time.toLocaleTimeString()}</time>
  `;

  // Add to top (for new announcements) or bottom (for old ones)
  if (toTop && announcementList.firstChild) {
    announcementList.insertBefore(li, announcementList.firstChild);
  } else {
    announcementList.appendChild(li);
  }
}

// Display all announcements in the list
export function displayAnnouncements(announcementList, announcements) {
  announcementList.innerHTML = "";
  announcements.forEach((a) =>
    addAnnouncementToList(announcementList, a, false)
  );
}

// Load stations from server with optional token
export async function fetchStations(token = null) {
  const headers = token ? { Authorization: "Bearer " + token } : {};
  const res = await fetch("/api/v1/stations", { headers });
  return await res.json();
}

// Try to use preloaded stations or fetch from server
export async function loadStationsWithPreload(token = null) {
  // Check if stations were preloaded in HTML
  if (
    window.preloadedData &&
    window.preloadedData.stations &&
    window.preloadedData.stations.length > 0
  ) {
    console.log("Using preloaded stations");
    return window.preloadedData.stations;
  } else {
    // Fallback: fetch from server
    console.log("Fetching stations (preload not available)");
    return await fetchStations(token);
  }
}

// Handle station selection change
export function handleStationChange(
  socket,
  newStationId,
  titleElements,
  announcementList,
  mapLine,
  token = null
) {
  return async () => {
    if (!newStationId) return;

    // Leave previous station room
    if (appState.currentStationId) {
      socket.emit("leaveStation", appState.currentStationId);
    }

    // Join new station room
    appState.currentStationId = newStationId;
    const stationName = appState.stations.find(
      (s) => s.id === newStationId
    ).name;

    // Update all title elements
    titleElements.forEach((el) => {
      if (el) el.textContent = stationName;
    });

    // Tell server we joined this station
    socket.emit("joinStation", appState.currentStationId);

    // Load announcements for this station
    const announcements = await loadAnnouncements(
      appState.currentStationId,
      token
    );
    displayAnnouncements(announcementList, announcements);

    // Update map to highlight selected station
    renderMap(mapLine);
  };
}

// Setup socket event listeners
export function setupSocketListeners(socket, announcementList, viewersText) {
  // When new announcement arrives via Socket.IO
  socket.on("announcement", (a) => {
    // Only show if it's for the station we're watching
    if (a.stationId === appState.currentStationId) {
      addAnnouncementToList(announcementList, a, true);
    }
  });

  // When viewer count updates via Socket.IO
  socket.on("presenceUpdate", ({ stationId, watchers }) => {
    // Only update if it's for the station we're watching
    if (stationId === appState.currentStationId) {
      viewersText.textContent = "Live viewers: " + watchers;
    }
  });
}
