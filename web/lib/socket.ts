import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export interface SocketAuthData {
  userId: string;
  apartmentId?: string | null;
  role?: string | null;
}

export function getSocket(authData?: SocketAuthData): Socket {
  const serverUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://nesteeq.onrender.com"
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001");

  if (!socket) {
    socket = io(serverUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: authData,
    });
  } else if (authData) {
    socket.auth = authData;
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
