import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { useIDSStore } from "@/store";
import { useQuery } from "@tanstack/react-query";
import type { TrafficLog } from "@shared/schema";
import { Network, ShieldAlert, Server, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

const ATTACK_COLOR: Record<string, string> = {
  ddos: "#ef4444",
  port_scan: "#f59e0b",
  brute_force: "#8b5cf6",
  Normal: "#10b981",
};

const SERVER_NODE_ID = "server-main";
const IDS_NODE_ID = "ids-engine";

function useTopologyData() {
  const liveTraffic = useIDSStore((s) => s.liveTraffic);

  const { data: historicLogs } = useQuery<TrafficLog[]>({
    queryKey: ["/api/traffic"],
    queryFn: async () => {
      const res = await fetch("/api/traffic?limit=100");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 30000,
  });

  const allLogs = useMemo(() => {
    const seen = new Set<number>();
    const combined: TrafficLog[] = [];
    for (const l of liveTraffic) {
      if (!seen.has(l.id)) { seen.add(l.id); combined.push(l); }
    }
    for (const l of historicLogs || []) {
      if (!seen.has(l.id)) { seen.add(l.id); combined.push(l); }
    }
    return combined.slice(0, 80);
  }, [liveTraffic, historicLogs]);

  return allLogs;
}

export default function NetworkTopology() {
  const logs = useTopologyData();
  const alerts = useIDSStore((s) => s.alerts);

  const { nodes, edges } = useMemo(() => {
    const ipMap = new Map<string, { count: number; isAnomaly: boolean; attackType: string }>();

    for (const log of logs) {
      const existing = ipMap.get(log.sourceIp);
      if (existing) {
        existing.count++;
        if (log.isAnomaly) { existing.isAnomaly = true; existing.attackType = log.attackType || "Unknown"; }
      } else {
        ipMap.set(log.sourceIp, {
          count: 1,
          isAnomaly: !!log.isAnomaly,
          attackType: log.attackType || "Normal",
        });
      }
    }

    // Layout: place IPs in a circle around the server
    const ips = [...ipMap.entries()];
    const radius = 340;
    const cx = 0;
    const cy = 0;

    const nodes: Node[] = [
      {
        id: SERVER_NODE_ID,
        type: "default",
        position: { x: cx, y: cy },
        data: { label: "10.0.0.1\nTarget Server" },
        style: {
          background: "#0d1117",
          border: "2px solid #22c55e",
          borderRadius: 12,
          color: "#22c55e",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
          fontWeight: 700,
          padding: "12px 16px",
          boxShadow: "0 0 20px -5px #22c55e66",
          whiteSpace: "pre",
        },
      },
      {
        id: IDS_NODE_ID,
        type: "default",
        position: { x: cx, y: cy - 140 },
        data: { label: "NIDS Engine\n■ ACTIVE" },
        style: {
          background: "#0d1117",
          border: "2px solid #3b82f6",
          borderRadius: 12,
          color: "#3b82f6",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
          fontWeight: 700,
          padding: "10px 14px",
          boxShadow: "0 0 20px -5px #3b82f666",
          whiteSpace: "pre",
        },
      },
    ];

    const edges: Edge[] = [
      {
        id: "ids-server",
        source: IDS_NODE_ID,
        target: SERVER_NODE_ID,
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 1.5, strokeDasharray: "4 4" },
      },
    ];

    ips.forEach(([ip, info], i) => {
      const angle = (2 * Math.PI * i) / ips.length - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const color = ATTACK_COLOR[info.attackType] || "#6b7280";
      const isHigh = info.isAnomaly && info.count > 3;

      nodes.push({
        id: ip,
        type: "default",
        position: { x, y },
        data: { label: `${ip}\n[${info.attackType}] ×${info.count}` },
        style: {
          background: "#0d1117",
          border: `2px solid ${color}`,
          borderRadius: 8,
          color,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 10,
          fontWeight: 600,
          padding: "8px 12px",
          boxShadow: isHigh ? `0 0 16px -4px ${color}aa` : "none",
          whiteSpace: "pre",
          opacity: 0.95,
        },
      });

      edges.push({
        id: `edge-${ip}`,
        source: ip,
        target: SERVER_NODE_ID,
        animated: info.isAnomaly,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 14,
          height: 14,
        },
        style: {
          stroke: color,
          strokeWidth: info.isAnomaly ? Math.min(1 + info.count * 0.3, 3.5) : 1,
          opacity: info.isAnomaly ? 0.9 : 0.3,
        },
        label: info.isAnomaly ? info.attackType : undefined,
        labelStyle: { fill: color, fontSize: 9, fontFamily: "JetBrains Mono, monospace", fontWeight: 600 },
        labelBgStyle: { fill: "#0d1117", fillOpacity: 0.9 },
      });
    });

    return { nodes, edges };
  }, [logs]);

  const threatCount = logs.filter(l => l.isAnomaly).length;
  const uniqueAttackers = new Set(logs.filter(l => l.isAnomaly).map(l => l.sourceIp)).size;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-glow flex items-center gap-3">
            <Network className="w-8 h-8 text-primary" />
            Network Topology
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Live attack source graph. Animated edges indicate active threat traffic.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Threat Events", value: threatCount, color: "text-red-400", icon: ShieldAlert },
            { label: "Unique Attackers", value: uniqueAttackers, color: "text-yellow-400", icon: Wifi },
            { label: "Total Sources", value: new Set(logs.map(l => l.sourceIp)).size, color: "text-blue-400", icon: Server },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Icon className={cn("w-3.5 h-3.5", color)} />
                <span className="text-xs text-muted-foreground font-mono">{label}</span>
              </div>
              <div className={cn("text-2xl font-bold font-mono", color)}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 shrink-0 flex-wrap">
        {Object.entries(ATTACK_COLOR).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: color, boxShadow: `0 0 6px ${color}66` }} />
            {type === "Normal" ? "Normal Traffic" : type.replace("_", " ").toUpperCase()}
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 bg-card border border-border rounded-xl overflow-hidden"
        style={{ background: "#0d1117" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnScroll
          colorMode="dark"
          style={{ background: "#0d1117" }}
        >
          <Background color="#1e2940" gap={24} size={1} />
          <Controls
            style={{
              background: "#0d1117",
              border: "1px solid #1e2940",
              borderRadius: 8,
            }}
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.id === SERVER_NODE_ID) return "#22c55e";
              if (n.id === IDS_NODE_ID) return "#3b82f6";
              return "#ef4444";
            }}
            maskColor="#0d1117cc"
            style={{ background: "#0d1117", border: "1px solid #1e2940", borderRadius: 8 }}
          />
        </ReactFlow>
      </motion.div>
    </div>
  );
}
