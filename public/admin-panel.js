import {
  appState,
  handleStationChange,
  initializeTrain,
  loadStationsWithPreload,
  populateStationDropdown,
  renderMap,
  resetViewerCount,
  setStationLoadError,
  setupMapDotSelection,
  setupSocketListeners,
  showAnnouncementPlaceholder,
  startClientSideTrainAnimation,
} from "./shared-utils.js";

function checkAuth() {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "/";
    return null;
  }

  return token;
}

const token = checkAuth();
if (!token) {
  throw new Error("Not authenticated");
}

const socket = io();

const stationSelect = document.getElementById("admin-station-select");
const adminStationTitle = document.getElementById("admin-station-title");
const adminMapTitle = document.getElementById("map-title");
const mapLine = document.getElementById("admin-map-line");
const announcementList = document.getElementById("admin-announcement-list");
const viewersText = document.getElementById("admin-viewers-text");
const announcementForm = document.getElementById("announcement-form");
const announcementText = document.getElementById("announcement-text");
const announcementError = document.getElementById("announcement-error");
const announcementCount = document.getElementById("announcement-count");
const logoutLink = document.getElementById("logout-link");
const selectedStationStat = document.getElementById("admin-selected-station-stat");
const stationCountStat = document.getElementById("admin-station-count-stat");
const viewersCountStat = document.getElementById("admin-viewers-count-stat");
const submitButton = announcementForm.querySelector("button");

function updateSelectedStation(station) {
  selectedStationStat.textContent = station ? station.name : "None";
}

function updateCharacterCount() {
  announcementCount.textContent = `${announcementText.value.length} / ${announcementText.maxLength}`;
}

async function init() {
  try {
    appState.stations = await loadStationsWithPreload(token);
    stationCountStat.textContent = String(appState.stations.length);

    populateStationDropdown(stationSelect);
    renderMap(mapLine);
    initializeTrain(mapLine);
    startClientSideTrainAnimation();
    showAnnouncementPlaceholder(announcementList);
    setupMapDotSelection(mapLine, stationSelect);
    setupSocketListeners(socket, announcementList, viewersText, viewersCountStat);
  } catch (err) {
    setStationLoadError(stationSelect, announcementList);
  }
}

stationSelect.addEventListener("change", async (e) => {
  resetViewerCount(viewersText, viewersCountStat);

  const handler = handleStationChange(
    socket,
    e.target.value,
    [adminStationTitle, adminMapTitle],
    announcementList,
    mapLine,
    token
  );
  const station = await handler();
  updateSelectedStation(station);
});

announcementText.addEventListener("input", () => {
  announcementError.textContent = "";
  updateCharacterCount();
});

announcementForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  announcementError.textContent = "";

  if (!appState.currentStationId) {
    announcementError.textContent = "Choose a station first.";
    return;
  }

  const text = announcementText.value.trim();
  if (!text) {
    announcementError.textContent = "Announcement text is required.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  try {
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

    if (!res.ok) {
      const body = await res.json();
      announcementError.textContent =
        body.message || "Failed to create announcement";
      return;
    }

    announcementText.value = "";
    updateCharacterCount();
  } catch (err) {
    announcementError.textContent = "Network error. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Announcement";
  }
});

logoutLink.addEventListener("click", () => {
  localStorage.removeItem("adminToken");
});

updateCharacterCount();
init();
