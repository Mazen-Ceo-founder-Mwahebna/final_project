// Store the socket.io instance here
let io = null;

// Function to save the socket.io instance
export function setIo(serverIo) {
  io = serverIo;
}

// Function to get the socket.io instance from anywhere
export function getIo() {
  return io;
}
