import io from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket: any;

export const getSocket = async () => {
  if (socket) return socket;

  socket = io("http://192.168.100.173:3000", {
    transports: ["websocket"],
  });

  const userStr = await AsyncStorage.getItem("app_token");
  if (userStr) {
    const user = JSON.parse(userStr);
    socket.emit("authenticate", user.id, user.role);
  }

  return socket;
};
