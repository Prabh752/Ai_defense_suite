import { useEffect, useRef } from "react";
import { useIDSStore } from "@/store";
import { toast } from "sonner";
import type { TrafficLog, SystemStat } from "@shared/schema";

const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(RECONNECT_DELAY);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const store = useIDSStore();

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      store.setWsStatus("connecting");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) { ws.close(); return; }
        store.setWsStatus("connected");
        reconnectDelay.current = RECONNECT_DELAY;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch (_) {}
      };

      ws.onerror = () => {
        store.setWsStatus("error");
      };

      ws.onclose = () => {
        if (unmounted) return;
        store.setWsStatus("disconnected");
        reconnectTimer.current = setTimeout(() => {
          if (!unmounted) {
            reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, MAX_RECONNECT_DELAY);
            connect();
          }
        }, reconnectDelay.current);
      };
    }

    function handleMessage(msg: { type: string; data?: any }) {
      switch (msg.type) {
        case "traffic_event": {
          const log = msg.data as TrafficLog;
          store.addTrafficEvent(log);
          break;
        }
        case "system_stats": {
          const stat = msg.data as SystemStat;
          store.addSystemStat(stat);
          break;
        }
        case "alert": {
          const { id, attackType, sourceIp, severity } = msg.data;
          store.addAlert({ id, attackType, sourceIp, severity });
          if (severity === "high") {
            toast.error(`High Severity Threat Detected`, {
              description: `${attackType} from ${sourceIp}`,
              duration: 6000,
            });
          } else if (severity === "medium") {
            toast.warning(`Threat Detected: ${attackType}`, {
              description: `Source: ${sourceIp}`,
              duration: 4000,
            });
          }
          break;
        }
        case "model_status": {
          const { id, status } = msg.data;
          store.setModelStatus(id, status);
          if (status === "active") {
            toast.success(`Model training complete`, { duration: 3000 });
          }
          break;
        }
        case "simulation_complete": {
          const { attackType } = msg.data;
          toast.info(`Simulation complete: ${attackType}`, { duration: 3000 });
          break;
        }
      }
    }

    connect();

    return () => {
      unmounted = true;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
}
