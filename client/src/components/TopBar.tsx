import { useState, useEffect } from "react";
import { Bell, Search, ShieldAlert, Wifi, WifiOff, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIDSStore } from "@/store";
import { getPageMeta } from "@/components/PageSplash";

interface TopBarProps {
  currentPath: string;
  onOpenCommandPalette: () => void;
}

function NotificationDrawer({ onClose }: { onClose: () => void }) {
  const alerts = useIDSStore(s => s.alerts);
  const markAllRead = useIDSStore(s => s.markAllRead);
  const clearAlerts = useIDSStore(s => s.clearAlerts);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-50"
      style={{ boxShadow: "0 0 40px -10px hsl(var(--primary)/0.2), 0 20px 40px -10px rgba(0,0,0,0.6)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <span className="text-sm font-bold font-mono text-foreground">Alerts</span>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="text-[10px] font-mono text-primary/60 hover:text-primary transition-colors">Mark read</button>
          <button onClick={clearAlerts} className="text-[10px] font-mono text-red-400/60 hover:text-red-400 transition-colors">Clear</button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm font-mono">
            No active alerts
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={cn(
                "px-4 py-3 border-b border-border/30 text-xs font-mono",
                !alert.read && "border-l-2",
                alert.severity === "high" ? "border-l-red-400 bg-red-500/3" :
                alert.severity === "medium" ? "border-l-yellow-400 bg-yellow-500/3" :
                "border-l-blue-400"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "font-bold uppercase text-[10px]",
                  alert.severity === "high" ? "text-red-400" : alert.severity === "medium" ? "text-yellow-400" : "text-blue-400"
                )}>
                  [{alert.severity}] {alert.attackType}
                </span>
                {!alert.read && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <div className="text-muted-foreground">{alert.sourceIp}</div>
              <div className="text-muted-foreground/40 mt-0.5 text-[10px]">{format(new Date(alert.timestamp), "HH:mm:ss")}</div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export function TopBar({ currentPath, onOpenCommandPalette }: TopBarProps) {
  const [now, setNow] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const wsStatus = useIDSStore(s => s.wsStatus);
  const unreadCount = useIDSStore(s => s.unreadCount);
  const liveTraffic = useIDSStore(s => s.liveTraffic);
  const latestStat = useIDSStore(s => s.latestStat);

  const meta = getPageMeta(currentPath);
  const Icon = meta.icon;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pps = liveTraffic.slice(0, 10).length;

  return (
    <div className="h-14 border-b border-border/50 bg-card/60 backdrop-blur-sm flex items-center px-6 gap-4 shrink-0 relative z-30">
      {/* Page breadcrumb */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn("p-1.5 rounded-lg border", meta.accent)}>
          <Icon className={cn("w-4 h-4", meta.color)} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="text-primary/60">NIDS_PRO</span>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className={cn("font-semibold", meta.color)}>{meta.label}</span>
          </div>
          <div className="text-[10px] text-muted-foreground/40 font-mono truncate">{meta.description}</div>
        </div>
      </div>

      {/* Live telemetry pills */}
      <div className="hidden md:flex items-center gap-2">
        {latestStat && (
          <>
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono",
              (latestStat.cpuUsage || 0) > 80 ? "bg-red-500/10 border-red-500/25 text-red-400" : "bg-muted/30 border-border/50 text-muted-foreground"
            )}>
              CPU {latestStat.cpuUsage?.toFixed(0)}%
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50 text-[10px] font-mono text-muted-foreground bg-muted/30">
              MEM {latestStat.memoryUsage?.toFixed(0)}%
            </div>
          </>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 text-[10px] font-mono text-primary/70 bg-primary/5">
          {liveTraffic.length} events
        </div>
      </div>

      {/* Search button */}
      <button
        onClick={onOpenCommandPalette}
        data-testid="button-command-palette"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-xs font-mono group"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-muted/50 rounded text-[9px] border border-border/40 text-muted-foreground/60 group-hover:border-primary/30">
          ⌘K
        </kbd>
      </button>

      {/* WS status */}
      <div className={cn(
        "hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-mono",
        wsStatus === "connected" ? "bg-primary/10 border-primary/25 text-primary" :
        wsStatus === "connecting" ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-400" :
        "bg-red-500/10 border-red-500/25 text-red-400"
      )}>
        {wsStatus === "connected"
          ? <><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE</>
          : wsStatus === "connecting"
          ? <><div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> SYNC</>
          : <><WifiOff className="w-3 h-3" /> OFF</>
        }
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          data-testid="button-notifications"
          onClick={() => setShowNotifications(s => !s)}
          className={cn(
            "relative p-2 rounded-lg border transition-colors",
            unreadCount > 0
              ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
          )}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <NotificationDrawer onClose={() => setShowNotifications(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Clock */}
      <div className="hidden lg:block text-xs font-mono text-muted-foreground/50 tabular-nums shrink-0">
        {format(now, "HH:mm:ss")}
      </div>
    </div>
  );
}
