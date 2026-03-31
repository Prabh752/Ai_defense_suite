import { useEffect, useRef, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { Shield, ShieldAlert, ArrowRight, Search, Wifi, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIDSStore } from "@/store";
import { useTrafficLogs } from "@/hooks/use-traffic";
import type { TrafficLog } from "@shared/schema";

const FILTERS = ["all", "anomaly", "tcp", "udp"] as const;

function LogRow({ log, style }: { log: TrafficLog; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        "absolute top-0 left-0 right-0 grid grid-cols-12 gap-3 px-4 py-2 text-xs font-mono items-center border-b border-border/30 transition-colors group",
        log.isAnomaly
          ? "bg-destructive/8 hover:bg-destructive/15 text-foreground"
          : "hover:bg-muted/30 text-muted-foreground"
      )}
    >
      <div className="col-span-2 opacity-60 tabular-nums">
        {format(new Date(log.timestamp!), "HH:mm:ss.SSS")}
      </div>
      <div className="col-span-2 text-foreground">{log.sourceIp}</div>
      <div className="col-span-2 flex items-center gap-1">
        <ArrowRight className="w-2.5 h-2.5 opacity-40 shrink-0" />
        {log.destinationIp}
      </div>
      <div className="col-span-1">
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-bold border",
          log.protocol === "TCP" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
          log.protocol === "UDP" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
          "bg-gray-500/10 text-gray-400 border-gray-500/20"
        )}>
          {log.protocol}
        </span>
      </div>
      <div className="col-span-1 tabular-nums">{log.length}B</div>
      <div className="col-span-3 truncate opacity-75" title={log.info || ""}>
        {log.info}
      </div>
      <div className="col-span-1 flex justify-end">
        {log.isAnomaly ? (
          <div className="flex items-center gap-1 text-destructive font-bold">
            <ShieldAlert className="w-3 h-3" />
            <span className="text-[10px]">{log.attackType || "THREAT"}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-emerald-500 font-bold">
            <Shield className="w-3 h-3" />
            <span className="text-[10px]">OK</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveTraffic() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [paused, setPaused] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const liveTraffic = useIDSStore((s) => s.liveTraffic);
  const wsStatus = useIDSStore((s) => s.wsStatus);

  // Fall back to HTTP polling if WS not loaded yet
  const { data: polledLogs } = useTrafficLogs({ limit: 100 });

  const allLogs = useMemo<TrafficLog[]>(() => {
    if (liveTraffic.length > 0) {
      return liveTraffic;
    }
    return polledLogs || [];
  }, [liveTraffic, polledLogs]);

  const filteredLogs = useMemo(() => {
    if (paused) return allLogs; // show last snapshot when paused
    return allLogs.filter((log) => {
      if (filter === "all") return true;
      if (filter === "anomaly") return log.isAnomaly;
      return log.protocol.toLowerCase() === filter;
    });
  }, [allLogs, filter, paused]);

  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  // Auto-scroll to top when new events arrive (unless paused)
  useEffect(() => {
    if (!paused && parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [allLogs.length, paused]);

  const anomalyCount = filteredLogs.filter(l => l.isAnomaly).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4 h-[calc(100vh-2rem)] flex flex-col"
    >
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Live Traffic Monitor
            <AnimatePresence mode="wait">
              {wsStatus === "connected" ? (
                <motion.div
                  key="live"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/30 rounded-full"
                >
                  <Radio className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-xs font-mono text-primary font-bold">LIVE</span>
                </motion.div>
              ) : (
                <motion.div
                  key="poll"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full"
                >
                  <Wifi className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-mono text-yellow-400 font-bold">POLLING</span>
                </motion.div>
              )}
            </AnimatePresence>
          </h2>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {filteredLogs.length.toLocaleString()} packets &middot; {anomalyCount} threats &middot; TanStack Virtual scroll
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => setPaused(p => !p)}
            data-testid="button-pause"
            className={cn(
              "px-3 py-1.5 text-xs font-mono font-bold rounded-md border transition-all",
              paused
                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                : "bg-muted border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {paused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>

          <div className="flex gap-1 bg-card border border-border p-1 rounded-lg">
            {FILTERS.map((f) => (
              <button
                key={f}
                data-testid={`filter-${f}`}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-muted/30 border-b border-border text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Source IP</div>
          <div className="col-span-2">Destination</div>
          <div className="col-span-1">Proto</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-3">Info</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground opacity-50 py-12">
            <Search className="w-12 h-12 mb-3" />
            <p className="font-mono text-sm">No logs match the current filter</p>
          </div>
        ) : (
          <div
            ref={parentRef}
            className="flex-1 overflow-y-auto relative"
            style={{ contain: "strict" }}
          >
            <div
              style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <LogRow
                  key={filteredLogs[virtualRow.index].id}
                  log={filteredLogs[virtualRow.index]}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    height: virtualRow.size,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
