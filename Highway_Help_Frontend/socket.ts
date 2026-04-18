import io from "socket.io-client";
import { BASE_URL, SOCKET_OPTIONS } from "./lib/runtime";
import { getStoredToken, getStoredUser } from "./lib/auth-storage";

let socket: any;

export const getSocket = async () => {
  if (socket) return socket;

  const token = await getStoredToken();

  socket = io(BASE_URL, {
    ...SOCKET_OPTIONS,
    auth: { token },
  });

  const userStr = await getStoredUser();
  if (userStr) {
    const user = JSON.parse(userStr);
    socket.emit("authenticate", user.id, user.role);
  }

  return socket;
};
