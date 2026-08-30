// Import function to save socket.io instance
import { setIo } from "./ioInstance.js";

// Main function to set up all socket events
export default function setupSockets(io) {
  // Save io instance so other files can use it
  setIo(io);

  const getRoomName = (stationId) => `station:${stationId}`;

  const emitPresence = (stationId) => {
    const roomName = getRoomName(stationId);
    const watchers = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    io.to(roomName).emit("presenceUpdate", { stationId, watchers });
  };

  // Listen for new socket connections
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // When user joins a station room
    socket.on("joinStation", (stationId) => {
      if (!stationId) return;

      const previousRoom = socket.data.stationId;
      if (previousRoom && previousRoom !== stationId) {
        socket.leave(getRoomName(previousRoom));
        emitPresence(previousRoom);
      }

      socket.data.stationId = stationId;
      socket.join(getRoomName(stationId));
      emitPresence(stationId);
    });

    // When user leaves a station room
    socket.on("leaveStation", (stationId) => {
      if (!stationId) return;

      socket.leave(getRoomName(stationId));
      emitPresence(stationId);

      if (socket.data.stationId === stationId) {
        delete socket.data.stationId;
      }
    });

    // When socket disconnects (user closes browser/tab)
    socket.on("disconnect", () => {
      const stationId = socket.data.stationId;
      if (stationId) {
        emitPresence(stationId);
      }
      console.log("Socket disconnected:", socket.id);
    });
  });
}
