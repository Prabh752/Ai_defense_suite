import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIDSStore } from "@/store";
import { Map, AlertTriangle, Shield, Globe, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

// Approximate world map positions as percentages (x, y) of container
const CITY_NODES = [
  { id: "new-york", name: "New York", country: "US", x: 23, y: 30, type: "target" },
  { id: "london", name: "London", country: "UK", x: 46, y: 23, type: "target" },
  { id: "frankfurt", name: "Frankfurt", country: "DE", x: 50, y: 22, type: "target" },
  { id: "singapore", name: "Singapore", country: "SG", x: 76, y: 55, type: "target" },
  { id: "tokyo", name: "Tokyo", country: "JP", x: 83, y: 28, type: "target" },
  { id: "sydney", name: "Sydney", country: "AU", x: 82, y: 73, type: "target" },
  { id: "moscow", name: "Moscow", country: "RU", x: 59, y: 18, type: "attacker" },
  { id: "beijing", name: "Beijing", country: "CN", x: 79, y: 28, type: "attacker" },
  { id: "north-korea", name: "Pyongyang", country: "KP", x: 82, y: 26, type: "attacker" },
  { id: "iran", name: "Tehran", country: "IR", x: 62, y: 33, type: "attacker" },
  { id: "nigeria", name: "Lagos", country: "NG", x: 48, y: 50, type: "attacker" },
  { id: "brazil", name: "São Paulo", country: "BR", x: 31, y: 62, type: "attacker" },
  { id: "india", name: "Mumbai", country: "IN", x: 68, y: 40, type: "neutral" },
  { id: "dubai", name: "Dubai", country: "AE", x: 63, y: 38, type: "neutral" },
];

const TARGET_NODE = { id: "target", name: "HQ Servers", x: 23, y: 30 };
const ATTACKER_COLORS: Record<string, string> = {
  "RU": "#ef4444",
  "CN": "#f59e0b",
  "KP": "#ef4444",
  "IR": "#f59e0b",
  "NG": "#ef4444",
  "BR": "#f59e0b",
};

interface AttackArc {
  id: string;
  from: typeof CITY_NODES[0];
  to: typeof CITY_NODES[0];
  severity: "high" | "medium" | "low";
  type: string;
  active: boolean;
}

function generateArcs(): AttackArc[] {
  const attackers = CITY_NODES.filter(n => n.type === "attacker");
  const targets = CITY_NODES.filter(n => n.type === "target");
  const types = ["Port Scan", "DDoS", "Brute Force", "SQLi", "XSS", "Exploit"];
  return attackers.slice(0, 4).map((a, i) => ({
    id: `arc-${i}`,
    from: a,
    to: targets[i % targets.length],
    severity: i === 0 ? "high" : i < 3 ? "medium" : "low",
    type: types[i % types.length],
    active: Math.random() > 0.3,
  }));
}

function AnimatedArc({ arc, containerWidth, containerHeight }: { arc: AttackArc; containerWidth: number; containerHeight: number }) {
  const x1 = (arc.from.x / 100) * containerWidth;
  const y1 = (arc.from.y / 100) * containerHeight;
  const x2 = (arc.to.x / 100) * containerWidth;
  const y2 = (arc.to.y / 100) * containerHeight;

  const midX = (x1 + x2) / 2;
  const midY = Math.min(y1, y2) - 60;
  const pathD = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

  const color = arc.severity === "high" ? "#ef4444" : arc.severity === "medium" ? "#f59e0b" : "#3b82f6";

  return (
    <g>
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="4 4" />
      <motion.circle
        r={3}
        fill={color}
        filter={`drop-shadow(0 0 6px ${color})`}
        animate={{
          offsetDistance: ["0%", "100%"],
        }}
        style={{
          offsetPath: `path("${pathD}")`,
          offsetDistance: "0%",
        }}
        transition={{
          duration: 2 + Math.random() * 1.5,
          repeat: Infinity,
          ease: "linear",
          delay: Math.random() * 2,
        }}
      />
    </g>
  );
}

export default function ThreatMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 400 });
  const [arcs, setArcs] = useState<AttackArc[]>([]);
  const [activeNode, setActiveNode] = useState<typeof CITY_NODES[0] | null>(null);
  const [attackCount, setAttackCount] = useState(0);
  const liveAlerts = useIDSStore(s => s.alerts);

  useEffect(() => {
    setArcs(generateArcs());
    const interval = setInterval(() => {
      setArcs(generateArcs());
      setAttackCount(c => c + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const rect = entries[0].contentRect;
      setDims({ width: rect.width, height: rect.height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const topThreats = [
    { country: "Russia", attacks: 847, color: "#ef4444" },
    { country: "China", attacks: 623, color: "#f59e0b" },
    { country: "N. Korea", attacks: 412, color: "#ef4444" },
    { country: "Iran", attacks: 289, color: "#f59e0b" },
    { country: "Nigeria", attacks: 156, color: "#ef4444" },
    { country: "Brazil", attacks: 98, color: "#f59e0b" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
              <Map className="w-7 h-7 text-red-400" />
            </div>
            Threat Intelligence Map
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Real-time visualization of global cyberattack origins targeting your infrastructure.
          </p>
        </div>

        <div className="flex gap-3">
          {[
            { label: "Active Attacks", value: arcs.filter(a => a.active).length, color: "text-red-400" },
            { label: "Blocked Today", value: attackCount + 2341, color: "text-primary" },
            { label: "Live Alerts", value: liveAlerts.length, color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
              <div className={cn("text-xl font-bold font-mono", s.color)}>{s.value.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Live Attack Feed</span>
        </div>

        <div
          ref={containerRef}
          className="relative w-full"
          style={{ paddingBottom: "50%" }}
        >
          {/* World map SVG background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, hsl(var(--primary)/0.05) 0%, transparent 70%),
              linear-gradient(hsl(var(--primary)/0.05) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)/0.05) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          }} />

          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${dims.width} ${dims.height}`}
            style={{ filter: "none" }}
          >
            {/* World continents simplified outline */}
            <rect x="0" y="0" width={dims.width} height={dims.height} fill="none" />

            {/* Attack arcs */}
            {arcs.map(arc => (
              <AnimatedArc
                key={arc.id}
                arc={arc}
                containerWidth={dims.width}
                containerHeight={dims.height}
              />
            ))}

            {/* City nodes */}
            {CITY_NODES.map(node => {
              const cx = (node.x / 100) * dims.width;
              const cy = (node.y / 100) * dims.height;
              const isAttacker = node.type === "attacker";
              const isTarget = node.type === "target";
              const color = isAttacker ? "#ef4444" : isTarget ? "#10b981" : "#6b7280";
              const isActive = activeNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => setActiveNode(isActive ? null : node)}
                  style={{ cursor: "pointer" }}
                >
                  {isActive && (
                    <motion.circle
                      cx={cx} cy={cy} r={20}
                      fill={color}
                      fillOpacity={0.1}
                      stroke={color}
                      strokeOpacity={0.3}
                      strokeWidth={1}
                      animate={{ r: [15, 25, 15] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {isAttacker && (
                    <motion.circle
                      cx={cx} cy={cy} r={12}
                      fill="none"
                      stroke={color}
                      strokeOpacity={0.3}
                      strokeWidth={1}
                      animate={{ r: [8, 16], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  <circle cx={cx} cy={cy} r={isAttacker ? 5 : isTarget ? 4 : 3} fill={color} filter={`drop-shadow(0 0 4px ${color})`} />
                  <text
                    x={cx + 8} y={cy + 4}
                    fontSize={9}
                    fill={color}
                    fontFamily="JetBrains Mono, monospace"
                    opacity={0.8}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] font-mono">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" />Attack Origin</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" />Target</div>
            <div className="flex items-center gap-1.5"><div className="w-8 h-px border-t border-dashed border-red-400/50" />Active Attack</div>
          </div>

          {/* Active node tooltip */}
          <AnimatePresence>
            {activeNode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 right-4 bg-card/95 border border-primary/30 rounded-xl p-4 backdrop-blur-md"
              >
                <div className="text-sm font-bold font-mono text-foreground">{activeNode.name}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">{activeNode.country}</div>
                <div className={cn(
                  "text-xs font-bold uppercase mt-2",
                  activeNode.type === "attacker" ? "text-red-400" : activeNode.type === "target" ? "text-emerald-400" : "text-muted-foreground"
                )}>
                  {activeNode.type === "attacker" ? "Threat Origin" : activeNode.type === "target" ? "Target Node" : "Transit Node"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Top threat sources */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Top Threat Sources
          </div>
          <div className="space-y-2.5">
            {topThreats.map((t, i) => (
              <div key={t.country} className="flex items-center gap-3">
                <div className="text-xs font-mono text-muted-foreground w-4">{i + 1}</div>
                <div className="text-xs font-mono text-foreground w-20">{t.country}</div>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: t.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.attacks / 847) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <div className="text-xs font-mono font-bold" style={{ color: t.color }}>{t.attacks}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active attack details */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" /> Active Attack Vectors
          </div>
          <div className="space-y-2">
            {arcs.filter(a => a.active).map(arc => (
              <div key={arc.id} className={cn(
                "flex items-center justify-between p-3 rounded-lg border text-xs font-mono",
                arc.severity === "high" ? "bg-red-500/5 border-red-500/20" : "bg-yellow-500/5 border-yellow-500/20"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", arc.severity === "high" ? "bg-red-400 animate-pulse" : "bg-yellow-400 animate-pulse")} />
                  <span className={arc.severity === "high" ? "text-red-400" : "text-yellow-400"}>{arc.type}</span>
                </div>
                <div className="text-muted-foreground">
                  {arc.from.name} → {arc.to.name}
                </div>
              </div>
            ))}
            {arcs.filter(a => a.active).length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-xs font-mono">No active attacks</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
