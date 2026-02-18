import { useTrafficLogs } from "@/hooks/use-traffic";
import { format } from "date-fns";
import { Shield, ShieldAlert, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LiveTraffic() {
  const [filter, setFilter] = useState("all");
  const { data: logs, isLoading } = useTrafficLogs({ limit: 50 });

  const filteredLogs = logs?.filter(log => {
    if (filter === "all") return true;
    if (filter === "anomaly") return log.isAnomaly;
    return log.protocol.toLowerCase() === filter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Traffic Monitor</h2>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Real-time packet inspection and logging.
          </p>
        </div>
        
        <div className="flex gap-2 bg-card border border-border p-1 rounded-lg">
          {["all", "anomaly", "tcp", "udp"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
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

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 border-b border-border text-xs font-mono text-muted-foreground uppercase tracking-wider">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Destination</div>
          <div className="col-span-1">Proto</div>
          <div className="col-span-1">Length</div>
          <div className="col-span-3">Info</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
          {filteredLogs?.map((log) => (
            <div 
              key={log.id} 
              className={cn(
                "grid grid-cols-12 gap-4 p-3 rounded-md text-sm font-mono items-center transition-colors border border-transparent",
                log.isAnomaly 
                  ? "bg-destructive/10 hover:bg-destructive/20 text-destructive-foreground border-destructive/20" 
                  : "hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <div className="col-span-2 text-xs opacity-70">
                {format(new Date(log.timestamp!), "HH:mm:ss.SSS")}
              </div>
              <div className="col-span-2">{log.sourceIp}</div>
              <div className="col-span-2 flex items-center gap-2">
                <ArrowRight className="w-3 h-3 opacity-50" />
                {log.destinationIp}
              </div>
              <div className="col-span-1">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                  log.protocol === "TCP" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  log.protocol === "UDP" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                  "bg-gray-500/10 text-gray-400 border-gray-500/20"
                )}>
                  {log.protocol}
                </span>
              </div>
              <div className="col-span-1 text-xs">{log.length}B</div>
              <div className="col-span-3 truncate opacity-80" title={log.info || ""}>
                {log.info}
              </div>
              <div className="col-span-1 text-right flex justify-end">
                {log.isAnomaly ? (
                  <div className="flex items-center gap-1.5 text-destructive font-bold text-xs">
                    <ShieldAlert className="w-3 h-3" />
                    <span>{log.attackType || "THREAT"}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
                    <Shield className="w-3 h-3" />
                    <span>OK</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredLogs?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-12">
              <Search className="w-12 h-12 mb-2" />
              <p>No logs found matching filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
