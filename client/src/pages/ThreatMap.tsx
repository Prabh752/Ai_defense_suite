import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIDSStore } from "@/store";
import { Map, AlertTriangle, Shield, Zap, Activity, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// === IP → Approximate Geo Heuristic (Mercator %, x: 0-100, y: 0-100) ===
function ipToGeo(ip: string): { x: number; y: number; region: string } {
  const parts = ip.split(".").map(Number);
  const first = parts[0] || 0;
  const second = parts[1] || 0;

  // Known simulation IPs
  const known: Record<string, { x: number; y: number; region: string }> = {
    "45.33.22.11":    { x: 22, y: 30, region: "US East" },
    "203.0.113.42":   { x: 80, y: 52, region: "Singapore" },
    "10.10.10.55":    { x: 59, y: 18, region: "Russia" },
    "172.16.0.100":   { x: 79, y: 30, region: "China" },
    "192.168.1.200":  { x: 50, y: 22, region: "Germany" },
    "192.168.1.100":  { x: 47, y: 23, region: "UK" },
  };

  const knownKey = Object.keys(known).find(k => ip.startsWith(k.split(".").slice(0, 2).join(".")));
  if (knownKey && known[knownKey]) return known[knownKey];
  if (known[ip]) return known[ip];

  // Heuristic fallback based on first octet
  if (ip.startsWith("192.168") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return { x: 23, y: 30, region: "Internal" };
  }
  if (first <= 50)  return { x: 18 + (second % 12), y: 28 + (second % 15), region: "North America" };
  if (first <= 80)  return { x: 22 + (second % 10), y: 55 + (second % 18), region: "South America" };
  if (first <= 110) return { x: 44 + (second % 10), y: 18 + (second % 14), region: "Europe" };
  if (first <= 140) return { x: 46 + (second % 12), y: 40 + (second % 22), region: "Africa" };
  if (first <= 180) return { x: 62 + (second % 20), y: 22 + (second % 28), region: "Asia" };
  if (first <= 210) return { x: 80 + (second % 8),  y: 64 + (second % 14), region: "Oceania" };
  return { x: 15 + (second % 10), y: 42 + (second % 20), region: "Unknown" };
}

// Target (home server) position
const HOME = { x: 23, y: 28 };

// Simplified continent SVG polygons in a 1000×500 viewBox
const CONTINENTS = [
  // North America
  { id: "na", d: "M 70,40 L 155,25 L 185,30 L 205,48 L 210,80 L 205,130 L 185,155 L 155,175 L 130,195 L 108,210 L 88,188 L 72,160 L 65,120 L 60,88 L 68,58 Z" },
  // South America
  { id: "sa", d: "M 168,228 L 202,218 L 232,228 L 252,260 L 254,302 L 242,342 L 222,370 L 194,390 L 172,382 L 160,350 L 158,312 L 164,272 Z" },
  // Europe
  { id: "eu", d: "M 440,58 L 475,45 L 505,50 L 525,68 L 520,95 L 498,108 L 468,110 L 445,98 L 432,78 Z" },
  // Africa
  { id: "af", d: "M 448,142 L 492,132 L 532,142 L 562,172 L 565,222 L 558,272 L 530,322 L 495,358 L 468,360 L 442,322 L 428,270 L 428,218 L 440,172 Z" },
  // Asia (simplified)
  { id: "as", d: "M 522,42 L 598,28 L 702,32 L 800,38 L 872,58 L 882,102 L 855,142 L 802,162 L 752,172 L 700,162 L 648,170 L 602,162 L 565,148 L 542,128 L 528,98 L 524,68 Z" },
  // Australia
  { id: "au", d: "M 748,278 L 800,268 L 848,278 L 878,308 L 868,342 L 838,358 L 802,364 L 762,354 L 740,328 L 744,298 Z" },
  // Greenland
  { id: "gl", d: "M 170,10 L 215,5 L 240,12 L 238,32 L 212,38 L 180,30 Z" },
];

interface LiveArc {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  sourceIp: string;
  attackType: string;
  severity: "high" | "medium" | "low";
  region: string;
  timestamp: Date;
  animating: boolean;
}

const SEVERITY_COLOR = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#3b82f6",
};

function buildPath(x1: number, y1: number, x2: number, y2: number, W: number, H: number): string {
  const px1 = (x1 / 100) * W;
  const py1 = (y1 / 100) * H;
  const px2 = (x2 / 100) * W;
  const py2 = (y2 / 100) * H;
  const midX = (px1 + px2) / 2;
  const midY = Math.min(py1, py2) - Math.max(50, Math.abs(px2 - px1) * 0.4);
  return `M ${px1} ${py1} Q ${midX} ${midY} ${px2} ${py2}`;
}

function TravelingDot({ d, color, delay = 0 }: { d: string; color: string; delay?: number }) {
  return (
    <motion.circle
      r={4}
      fill={color}
      filter={`drop-shadow(0 0 5px ${color})`}
      style={{ offsetPath: `path("${d}")`, offsetDistance: "0%" }}
      animate={{ offsetDistance: ["0%", "100%"] }}
      transition={{ duration: 1.8, delay, ease: "easeInOut" }}
    />
  );
}

export default function ThreatMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  const [H, setH] = useState(400);
  const [arcs, setArcs] = useState<LiveArc[]>([]);
  const [totalBlocked, setTotalBlocked] = useState(2341);

  const liveTraffic = useIDSStore(s => s.liveTraffic);
  const liveAlerts = useIDSStore(s => s.alerts);
  const wsStatus = useIDSStore(s => s.wsStatus);

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setW(r.width);
      setH(r.height);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Convert live attack traffic to map arcs
  useEffect(() => {
    const attackLogs = liveTraffic.filter(l => l.isAnomaly).slice(0, 15);
    const newArcs: LiveArc[] = attackLogs.map(log => {
      const geo = ipToGeo(log.sourceIp);
      const sev: "high" | "medium" | "low" = (log.confidenceScore || 0) > 0.85 ? "high" : (log.confidenceScore || 0) > 0.5 ? "medium" : "low";
      return {
        id: `arc-${log.id}`,
        fromX: geo.x,
        fromY: geo.y,
        toX: HOME.x + (Math.random() * 4 - 2),
        toY: HOME.y + (Math.random() * 4 - 2),
        sourceIp: log.sourceIp,
        attackType: log.attackType || "Unknown",
        severity: sev,
        region: geo.region,
        timestamp: new Date(log.timestamp!),
        animating: true,
      };
    });

    // Deduplicate by IP
    const seen = new Set<string>();
    const deduped = newArcs.filter(a => {
      if (seen.has(a.sourceIp)) return false;
      seen.add(a.sourceIp);
      return true;
    });

    setArcs(deduped.slice(0, 12));
    setTotalBlocked(prev => prev + deduped.length);
  }, [liveTraffic.length]);

  // Geo positions of known attack IPs on screen
  const attackerDots = useMemo(() => {
    const byIp: Record<string, { geo: ReturnType<typeof ipToGeo>; count: number; latestSev: string }> = {};
    liveTraffic.filter(l => l.isAnomaly).forEach(l => {
      if (!byIp[l.sourceIp]) byIp[l.sourceIp] = { geo: ipToGeo(l.sourceIp), count: 0, latestSev: "low" };
      byIp[l.sourceIp].count++;
      const s = (l.confidenceScore || 0) > 0.85 ? "high" : (l.confidenceScore || 0) > 0.5 ? "medium" : "low";
      if (s === "high") byIp[l.sourceIp].latestSev = "high";
      else if (s === "medium" && byIp[l.sourceIp].latestSev !== "high") byIp[l.sourceIp].latestSev = "medium";
    });
    return Object.entries(byIp).map(([ip, v]) => ({ ip, ...v }));
  }, [liveTraffic]);

  // Country-level stats from real data
  const regionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    attackerDots.forEach(d => {
      map[d.geo.region] = (map[d.geo.region] || 0) + d.count;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [attackerDots]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
              <Globe className="w-7 h-7 text-red-400" />
            </div>
            Live Threat Intelligence Map
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Real-time visualization of cyberattacks sourced from live WebSocket traffic feed.
          </p>
        </div>

        <div className="flex gap-3">
          {[
            { label: "Live Arcs", value: arcs.length, color: "text-red-400" },
            { label: "Unique Sources", value: attackerDots.length, color: "text-yellow-400" },
            { label: "Total Blocked", value: totalBlocked.toLocaleString(), color: "text-primary" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
              <div className={cn("text-xl font-bold font-mono", s.color)}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.label}</div>
            </div>
          ))}

          <div className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold",
            wsStatus === "connected" ? "bg-primary/10 border-primary/25 text-primary" : "bg-muted/30 border-border text-muted-foreground"
          )}>
            <div className={cn("w-2 h-2 rounded-full", wsStatus === "connected" ? "bg-primary animate-pulse" : "bg-muted-foreground")} />
            {wsStatus === "connected" ? "LIVE" : "OFFLINE"}
          </div>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Map Canvas */}
        <div className="xl:col-span-3 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Live Attack Feed · {arcs.length} active vectors
              </span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/40">
              Sourced from WebSocket traffic stream
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative w-full"
            style={{ paddingBottom: "52%" }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background */}
              <rect width={W} height={H} fill="hsl(222 47% 4%)" />

              {/* Lat/Lon grid */}
              {Array.from({ length: 9 }, (_, i) => (
                <line key={`lat-${i}`} x1={0} y1={(i / 8) * H} x2={W} y2={(i / 8) * H} stroke="hsl(217 33% 17%)" strokeWidth={0.5} />
              ))}
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`lon-${i}`} x1={(i / 12) * W} y1={0} x2={(i / 12) * W} y2={H} stroke="hsl(217 33% 17%)" strokeWidth={0.5} />
              ))}

              {/* Continents */}
              {CONTINENTS.map(c => {
                // Scale continent paths to current W/H (paths are for 1000x500)
                const scaleX = W / 1000;
                const scaleY = H / 500;
                return (
                  <path
                    key={c.id}
                    d={c.d}
                    fill="hsl(217 33% 14%)"
                    stroke="hsl(217 33% 22%)"
                    strokeWidth={1}
                    transform={`scale(${scaleX}, ${scaleY})`}
                  />
                );
              })}

              {/* Attack arcs */}
              {arcs.map(arc => {
                const d = buildPath(arc.fromX, arc.fromY, arc.toX, arc.toY, W, H);
                const color = SEVERITY_COLOR[arc.severity];
                return (
                  <g key={arc.id}>
                    <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.25} strokeDasharray="6 4" />
                    <TravelingDot d={d} color={color} delay={Math.random() * 1.5} />
                  </g>
                );
              })}

              {/* Live attacker dots */}
              {attackerDots.map(({ ip, geo, count, latestSev }) => {
                const cx = (geo.x / 100) * W;
                const cy = (geo.y / 100) * H;
                const color = SEVERITY_COLOR[latestSev as keyof typeof SEVERITY_COLOR] || "#3b82f6";
                return (
                  <g key={ip}>
                    <motion.circle
                      cx={cx} cy={cy} r={8 + Math.min(count, 10)}
                      fill={color} fillOpacity={0.06}
                      stroke={color} strokeOpacity={0.25} strokeWidth={1}
                      animate={{ r: [6, 14 + Math.min(count, 8)], opacity: [0.4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />
                    <circle cx={cx} cy={cy} r={4} fill={color} filter={`drop-shadow(0 0 6px ${color})`} />
                    <text x={cx + 7} y={cy + 4} fontSize={Math.min(W / 100, 10)} fill={color} fontFamily="JetBrains Mono, monospace" opacity={0.75}>
                      {ip}
                    </text>
                  </g>
                );
              })}

              {/* Home/target dot */}
              <g>
                <motion.circle
                  cx={(HOME.x / 100) * W}
                  cy={(HOME.y / 100) * H}
                  r={16}
                  fill="hsl(var(--primary))"
                  fillOpacity={0.08}
                  stroke="hsl(var(--primary))"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                  animate={{ r: [10, 22], opacity: [0.5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                />
                <circle
                  cx={(HOME.x / 100) * W}
                  cy={(HOME.y / 100) * H}
                  r={5}
                  fill="hsl(var(--primary))"
                  filter="drop-shadow(0 0 8px hsl(var(--primary)))"
                />
                <text
                  x={(HOME.x / 100) * W + 8}
                  y={(HOME.y / 100) * H + 4}
                  fontSize={Math.min(W / 80, 11)}
                  fill="hsl(var(--primary))"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  HQ
                </text>
              </g>
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex gap-3 text-[10px] font-mono bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" />HQ Target</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" />High Threat</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-400" />Medium</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" />Low</div>
            </div>

            {/* No data state */}
            {attackerDots.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-muted-foreground/40 space-y-2">
                  <Shield className="w-10 h-10 mx-auto opacity-30" />
                  <div className="text-xs font-mono">No attacks detected yet</div>
                  <div className="text-[10px] font-mono opacity-60">Run an attack simulation to generate live arcs</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Attack Feed Sidebar */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          {/* Top Sources */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
              <AlertTriangle className="w-3 h-3 text-red-400" /> Top Regions
            </div>
            {regionCounts.length === 0 ? (
              <div className="text-xs font-mono text-muted-foreground/50 text-center py-4">No data yet</div>
            ) : (
              <div className="space-y-2.5">
                {regionCounts.map(([region, count], i) => (
                  <div key={region} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground/50 w-3">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-foreground truncate">{region}</div>
                      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-red-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((count / regionCounts[0][1]) * 100, 100)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-red-400">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Attack Log */}
          <div className="bg-card border border-border rounded-xl flex-1 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Live Event Log</span>
            </div>
            <div className="h-72 overflow-y-auto">
              <AnimatePresence initial={false}>
                {liveTraffic.filter(l => l.isAnomaly).slice(0, 30).map(log => {
                  const sev = (log.confidenceScore || 0) > 0.85 ? "high" : (log.confidenceScore || 0) > 0.5 ? "medium" : "low";
                  const geo = ipToGeo(log.sourceIp);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "px-3 py-2.5 border-b border-border/20 text-[10px] font-mono",
                        sev === "high" ? "border-l-2 border-l-red-400" :
                        sev === "medium" ? "border-l-2 border-l-yellow-400" : ""
                      )}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn(
                          "font-bold uppercase",
                          sev === "high" ? "text-red-400" : sev === "medium" ? "text-yellow-400" : "text-blue-400"
                        )}>
                          {log.attackType}
                        </span>
                        <span className="text-muted-foreground/50">
                          {format(new Date(log.timestamp!), "HH:mm:ss")}
                        </span>
                      </div>
                      <div className="text-muted-foreground">{log.sourceIp}</div>
                      <div className="text-muted-foreground/50">{geo.region} → {log.protocol}</div>
                    </motion.div>
                  );
                })}
                {liveTraffic.filter(l => l.isAnomaly).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground/40 text-[10px] font-mono">
                    Waiting for attack events...
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Anomalies", value: liveTraffic.filter(l => l.isAnomaly).length, color: "text-red-400", icon: Zap },
          { label: "Attack Types", value: [...new Set(liveTraffic.filter(l => l.isAnomaly).map(l => l.attackType))].length, color: "text-yellow-400", icon: AlertTriangle },
          { label: "Unique Source IPs", value: [...new Set(liveTraffic.filter(l => l.isAnomaly).map(l => l.sourceIp))].length, color: "text-orange-400", icon: Globe },
          { label: "Detection Rate", value: liveTraffic.length > 0 ? `${((liveTraffic.filter(l => l.isAnomaly).length / liveTraffic.length) * 100).toFixed(1)}%` : "0%", color: "text-primary", icon: Activity },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="p-2.5 bg-muted/30 rounded-xl">
              <s.icon className={cn("w-5 h-5", s.color)} />
            </div>
            <div>
              <div className={cn("text-xl font-bold font-mono", s.color)}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
