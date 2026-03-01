import { io } from "socket.io-client";

const URL = "https://realtime-whiteboard-ydus.onrender.com";

export const socket = io(URL, {
  transports: ["websocket"],
  withCredentials: true,
});