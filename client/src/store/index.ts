import { create } from "zustand";
import type { TrafficLog, SystemStat } from "@shared/schema";

export type AlertSeverity = "low" | "medium" | "high";
export type WSStatus = "connecting" | "connected" | "disconnected" | "error";

export interface Alert {
  id: string;
  attackType: string;
  sourceIp: string;
  severity: AlertSeverity;
  timestamp: Date;
  read: boolean;
}

interface IDSStore {
  // WebSocket state
  wsStatus: WSStatus;
  setWsStatus: (s: WSStatus) => void;

  // Live traffic feed (last 500 entries)
  liveTraffic: TrafficLog[];
  addTrafficEvent: (log: TrafficLog) => void;
  clearTraffic: () => void;

  // System stats stream
  latestStat: SystemStat | null;
  statsHistory: SystemStat[];
  addSystemStat: (stat: SystemStat) => void;

  // Alerts
  alerts: Alert[];
  unreadCount: number;
  addAlert: (alert: Omit<Alert, "timestamp" | "read">) => void;
  markAllRead: () => void;
  clearAlerts: () => void;

  // Model status overrides (from WS)
  modelStatuses: Record<number, string>;
  setModelStatus: (id: number, status: string) => void;
}

export const useIDSStore = create<IDSStore>((set, get) => ({
  wsStatus: "connecting",
  setWsStatus: (wsStatus) => set({ wsStatus }),

  liveTraffic: [],
  addTrafficEvent: (log) =>
    set((s) => ({
      liveTraffic: [log, ...s.liveTraffic].slice(0, 500),
    })),
  clearTraffic: () => set({ liveTraffic: [] }),

  latestStat: null,
  statsHistory: [],
  addSystemStat: (stat) =>
    set((s) => ({
      latestStat: stat,
      statsHistory: [...s.statsHistory, stat].slice(-60),
    })),

  alerts: [],
  unreadCount: 0,
  addAlert: (alert) =>
    set((s) => {
      const newAlert: Alert = { ...alert, timestamp: new Date(), read: false };
      return {
        alerts: [newAlert, ...s.alerts].slice(0, 50),
        unreadCount: s.unreadCount + 1,
      };
    }),
  markAllRead: () =>
    set((s) => ({
      alerts: s.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),
  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),

  modelStatuses: {},
  setModelStatus: (id, status) =>
    set((s) => ({ modelStatuses: { ...s.modelStatuses, [id]: status } })),
}));
