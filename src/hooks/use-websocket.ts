"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  WS_RECONNECT_BASE_DELAY,
  WS_RECONNECT_MAX_DELAY,
} from "@/lib/constants";
import type { ServerMessage } from "@/lib/ws/protocol";

type MessageHandler = (msg: ServerMessage) => void;

interface UseWebSocketOptions {
  onMessage?: MessageHandler;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onMessage, autoConnect = true } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(WS_RECONNECT_BASE_DELAY);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const messageHandlerRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  messageHandlerRef.current = onMessage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setConnected(true);
      reconnectDelay.current = WS_RECONNECT_BASE_DELAY;
      console.log("[WS] Connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerMessage;
        messageHandlerRef.current?.(msg);
      } catch (e) {
        console.warn("[WS] Failed to parse message:", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      // Auto-reconnect with exponential backoff
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(
        delay * 2,
        WS_RECONNECT_MAX_DELAY
      );
      console.log(`[WS] Disconnected, reconnecting in ${delay}ms`);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      // onclose will fire after this
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  const send = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback(
    (channel: string, id: string) => {
      send({ type: "subscribe", channel, id });
    },
    [send]
  );

  const unsubscribe = useCallback(
    (channel: string, id: string) => {
      send({ type: "unsubscribe", channel, id });
    },
    [send]
  );

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    connected,
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
  };
}
