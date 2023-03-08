import { useRef, useEffect } from "react";

export function useChannel(
  channelName: String,
  onMessage: (event: any) => void
) {
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wss = window.location.protocol === "http:" ? "ws://" : "wss://";
    const url = `${wss}${window.location.hostname}:${window.location.port}/channel/${channelName}`;
    async function getWebSocket() {
      const ws = new WebSocket(url);
      if (!ws) {
        throw new Error("server didn't accept WebSocket");
      }

      ws.addEventListener("message", (message) => onMessage(message));

      ws.addEventListener("open", (event) => {
        socket.current = ws;

        // Send user info message.
        ws.send(JSON.stringify({ name: "josh " + Date.now() }));
      });

      ws.addEventListener("close", (event) => {
        console.log(
          "WebSocket closed, reconnecting:",
          event.code,
          event.reason
        );
      });
      ws.addEventListener("error", (event) => {
        console.log("WebSocket error, reconnecting:", event);
      });

      socket.current = ws;
    }

    if (!socket.current) {
      getWebSocket();
    }

    return () => {
      socket.current?.removeEventListener("message", onMessage);
    };
  }, [channelName, onMessage]);
}
