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

const socket = io();

const stationSelect = document.getElementById("station-select");
const stationTitle = document.getElementById("station-title");
const mapTitle = document.getElementById("map-title");
const mapLine = document.getElementById("map-line");
const announcementList = document.getElementById("announcement-list");
const viewersText = document.getElementById("viewers-text");
const selectedStationStat = document.getElementById("selected-station-stat");
const stationCountStat = document.getElementById("station-count-stat");
const viewersCountStat = document.getElementById("viewers-count-stat");

function updateSelectedStation(station) {
  selectedStationStat.textContent = station ? station.name : "None";
}

async function init() {
  try {
    appState.stations = await loadStationsWithPreload();
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
    [stationTitle, mapTitle],
    announcementList,
    mapLine
  );
  const station = await handler();
  updateSelectedStation(station);
});

init();
