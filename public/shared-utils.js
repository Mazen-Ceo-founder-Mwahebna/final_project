export const TRAIN_CONFIG = {
  STOP_TIME: 3000,
  MOVE_TIME: 12000,
};

export const appState = {
  stations: [],
  currentStationId: null,
  currentTrainStationId: null,
  trainElement: null,
  currentTrainIndex: 0,
  isMovingForward: true,
  trainTimer: null,
};

const MESSAGES = {
  noStation: "Select a station to see announcements.",
  noAnnouncements: "No announcements yet for this station.",
  loadingAnnouncements: "Loading announcements...",
  loadingStations: "Loading stations...",
  stationError: "Unable to load stations. Please refresh the page.",
  announcementError: "Unable to load announcements. Please try again.",
};

function normalizeStations(stations) {
  if (!Array.isArray(stations)) return [];

  return stations
    .filter((station) => station && station.id && station.name)
    .sort(
      (a, b) => (a.line || 0) - (b.line || 0) || (a.order || 0) - (b.order || 0)
    );
}

function setAnnouncementMessage(announcementList, message) {
  announcementList.innerHTML = "";

  const li = document.createElement("li");
  li.className = "announcement-empty";
  li.textContent = message;
  announcementList.appendChild(li);
}

export function showAnnouncementPlaceholder(announcementList) {
  setAnnouncementMessage(announcementList, MESSAGES.noStation);
}

function updateViewerText(viewersText, viewersValue, watchers) {
  const count = Number.isFinite(Number(watchers)) ? Number(watchers) : 0;
  const label = count === 1 ? "Live viewer: 1" : `Live viewers: ${count}`;

  if (viewersText) viewersText.textContent = label;
  if (viewersValue) viewersValue.textContent = String(count);
}

function formatAnnouncementTime(value) {
  const time = new Date(value || Date.now());

  if (Number.isNaN(time.getTime())) {
    return "Just now";
  }

  return time.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function updateTrainPosition(index, isMoving = false) {
  if (!appState.trainElement || appState.stations.length === 0) return;

  const safeIndex = Math.max(0, Math.min(index, appState.stations.length - 1));
  const denominator = Math.max(appState.stations.length - 1, 1);
  const trainPosition = (safeIndex / denominator) * 100;
  const dotWidth = 34;
  const dotRadius = dotWidth / 2;
  const endCorrection = (dotWidth * trainPosition) / 100;

  appState.trainElement.style.transition = isMoving
    ? `left ${TRAIN_CONFIG.MOVE_TIME / 1000}s ease-in-out`
    : "none";
  appState.trainElement.style.left = `calc(${dotRadius}px + ${trainPosition}% - ${endCorrection}px)`;
  appState.currentTrainIndex = safeIndex;
  appState.currentTrainStationId = appState.stations[safeIndex].id;
}

export function startClientSideTrainAnimation() {
  if (appState.stations.length === 0) return;

  if (appState.trainTimer) {
    clearTimeout(appState.trainTimer);
  }

  const moveToNextStation = () => {
    updateTrainPosition(appState.currentTrainIndex, false);

    appState.trainTimer = setTimeout(() => {
      if (appState.isMovingForward) {
        if (appState.currentTrainIndex < appState.stations.length - 1) {
          appState.currentTrainIndex += 1;
        } else {
          appState.isMovingForward = false;
          appState.currentTrainIndex -= 1;
        }
      } else if (appState.currentTrainIndex > 0) {
        appState.currentTrainIndex -= 1;
      } else {
        appState.isMovingForward = true;
        appState.currentTrainIndex += 1;
      }

      updateTrainPosition(appState.currentTrainIndex, true);
      appState.trainTimer = setTimeout(moveToNextStation, TRAIN_CONFIG.MOVE_TIME);
    }, TRAIN_CONFIG.STOP_TIME);
  };

  moveToNextStation();
}

export function renderMap(mapLine) {
  const existingDots = mapLine.querySelectorAll(".station-dot");
  existingDots.forEach((dot) => dot.remove());

  appState.stations.forEach((station, index) => {
    const isSelected = station.id === appState.currentStationId;
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "station-dot" + (isSelected ? " selected" : "");
    dot.dataset.id = station.id;
    dot.dataset.index = String(index);
    dot.setAttribute("aria-label", `View ${station.name}`);
    dot.setAttribute("aria-pressed", isSelected ? "true" : "false");
    dot.title = station.name;

    const label = document.createElement("span");
    label.textContent = station.name;
    dot.appendChild(label);

    mapLine.appendChild(dot);
  });
}

export function initializeTrain(mapLine) {
  if (!appState.trainElement) {
    appState.trainElement = document.createElement("div");
    appState.trainElement.className = "train-icon";
    appState.trainElement.setAttribute("aria-label", "Live train position");
    appState.trainElement.setAttribute("role", "img");
    mapLine.appendChild(appState.trainElement);
  }

  appState.currentTrainIndex = 0;
  updateTrainPosition(0, false);
}

export function populateStationDropdown(selectElement) {
  selectElement.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = appState.stations.length
    ? "Choose a station"
    : "No stations available";
  placeholder.disabled = appState.stations.length > 0;
  placeholder.selected = true;
  selectElement.appendChild(placeholder);

  appState.stations.forEach((station) => {
    const option = document.createElement("option");
    option.value = station.id;
    option.textContent = station.name;
    selectElement.appendChild(option);
  });
}

export async function loadAnnouncements(stationId, token = null) {
  const headers = token ? { Authorization: "Bearer " + token } : {};
  const res = await fetch(`/api/v1/stations/${stationId}/announcements`, {
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to load announcements");
  }

  return await res.json();
}

export function addAnnouncementToList(announcementList, announcement, toTop = false) {
  const emptyState = announcementList.querySelector(".announcement-empty");
  if (emptyState) emptyState.remove();

  const li = document.createElement("li");
  li.className = "announcement-item";

  const text = document.createElement("div");
  text.textContent = announcement.text;

  const time = document.createElement("time");
  const createdAt = new Date(announcement.createdAt || Date.now());
  time.dateTime = Number.isNaN(createdAt.getTime())
    ? new Date().toISOString()
    : createdAt.toISOString();
  time.textContent = formatAnnouncementTime(announcement.createdAt);

  li.append(text, time);

  if (toTop && announcementList.firstChild) {
    announcementList.insertBefore(li, announcementList.firstChild);
  } else {
    announcementList.appendChild(li);
  }
}

export function displayAnnouncements(announcementList, announcements) {
  announcementList.innerHTML = "";

  if (!Array.isArray(announcements) || announcements.length === 0) {
    setAnnouncementMessage(announcementList, MESSAGES.noAnnouncements);
    return;
  }

  announcements.forEach((announcement) =>
    addAnnouncementToList(announcementList, announcement, false)
  );
}

export async function fetchStations(token = null) {
  const headers = token ? { Authorization: "Bearer " + token } : {};
  const res = await fetch("/api/v1/stations", { headers });

  if (!res.ok) {
    throw new Error("Failed to load stations");
  }

  return normalizeStations(await res.json());
}

export async function loadStationsWithPreload(token = null) {
  const preloadedStations = normalizeStations(window.preloadedData?.stations);

  if (preloadedStations.length > 0) {
    return preloadedStations;
  }

  return await fetchStations(token);
}

export function handleStationChange(
  socket,
  newStationId,
  titleElements,
  announcementList,
  mapLine,
  token = null
) {
  return async () => {
    if (!newStationId) {
      if (appState.currentStationId) {
        socket.emit("leaveStation", appState.currentStationId);
      }

      appState.currentStationId = null;
      titleElements.forEach((el) => {
        if (el) el.textContent = "Select Station";
      });
      renderMap(mapLine);
      setAnnouncementMessage(announcementList, MESSAGES.noStation);
      return null;
    }

    const station = appState.stations.find((item) => item.id === newStationId);
    if (!station) return null;

    if (appState.currentStationId && appState.currentStationId !== newStationId) {
      socket.emit("leaveStation", appState.currentStationId);
    }

    appState.currentStationId = newStationId;

    titleElements.forEach((el) => {
      if (el) el.textContent = station.name;
    });

    socket.emit("joinStation", appState.currentStationId);
    renderMap(mapLine);
    setAnnouncementMessage(announcementList, MESSAGES.loadingAnnouncements);
    announcementList.setAttribute("aria-busy", "true");

    try {
      const announcements = await loadAnnouncements(appState.currentStationId, token);
      if (appState.currentStationId === newStationId) {
        displayAnnouncements(announcementList, announcements);
      }
    } catch (err) {
      if (appState.currentStationId === newStationId) {
        setAnnouncementMessage(announcementList, MESSAGES.announcementError);
      }
    } finally {
      announcementList.setAttribute("aria-busy", "false");
    }

    return station;
  };
}

export function setupMapDotSelection(mapLine, selectElement) {
  mapLine.addEventListener("click", (event) => {
    const dot = event.target.closest(".station-dot");
    if (!dot) return;

    selectElement.value = dot.dataset.id;
    selectElement.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

export function setupSocketListeners(
  socket,
  announcementList,
  viewersText,
  viewersValue = null
) {
  socket.on("announcement", (announcement) => {
    if (announcement.stationId === appState.currentStationId) {
      addAnnouncementToList(announcementList, announcement, true);
    }
  });

  socket.on("presenceUpdate", ({ stationId, watchers }) => {
    if (stationId === appState.currentStationId) {
      updateViewerText(viewersText, viewersValue, watchers);
    }
  });
}

export function setStationLoadError(selectElement, announcementList) {
  selectElement.innerHTML = "";

  const option = document.createElement("option");
  option.value = "";
  option.textContent = "Stations unavailable";
  selectElement.appendChild(option);
  setAnnouncementMessage(announcementList, MESSAGES.stationError);
}

export function resetViewerCount(viewersText, viewersValue) {
  updateViewerText(viewersText, viewersValue, 0);
}
