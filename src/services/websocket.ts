const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  API_URL.replace(/^http/, "ws") + "/ws";

export type WebSocketMessage = {
  type: string;
  [key: string]: unknown;
};

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manuallyClosed = false;

export function connectWebSocket(
  onMessage: (message: WebSocketMessage) => void
) {
  const token = localStorage.getItem("kolapse_token");

  if (!token) {
    console.warn("WebSocket: No authentication token");
    return;
  }

  // Prevent duplicate connections
  if (
    socket?.readyState === WebSocket.OPEN ||
    socket?.readyState === WebSocket.CONNECTING
  ) {
    return;
  }

  manuallyClosed = false;

  socket = new WebSocket(
    `${WS_URL}?token=${encodeURIComponent(token)}`
  );

  socket.onopen = () => {
    console.log("KOLAPSE WebSocket connected");
  };

  socket.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      console.log("WebSocket message:", message);

      onMessage(message);
    } catch (error) {
      console.error(
        "Failed to parse WebSocket message:",
        error
      );
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("KOLAPSE WebSocket disconnected");

    socket = null;

    // Automatically reconnect after 3 seconds
    if (!manuallyClosed) {
      reconnectTimer = setTimeout(() => {
        connectWebSocket(onMessage);
      }, 3000);
    }
  };
}

export function disconnectWebSocket() {
  manuallyClosed = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
}