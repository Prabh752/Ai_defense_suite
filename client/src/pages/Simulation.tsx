import { useState, useEffect } from "react";
import { useStartSimulation } from "@/hooks/use-simulation";
import { Terminal } from "@/components/Terminal";
import { Play, Square, Zap, Server, Activity, Shield, Clock, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIDSStore } from "@/store";
import { format } from "date-fns";

type AttackType = "ddos" | "port_scan" | "brute_force" | "normal";
type Intensity = "low" | "medium" | "high";

const ATTACK_CONFIGS = [
  {
    id: "normal" as AttackType,
    label: "Normal Traffic",
    icon: Activity,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    description: "Simulates benign HTTP/HTTPS requests and standard TCP/UDP flows.",
  },
  {
    id: "ddos" as AttackType,
    label: "DDoS Attack",
    icon: Zap,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    description: "Floods target with high-volume UDP/TCP packets to exhaust resources.",
  },
  {
    id: "port_scan" as AttackType,
    label: "Port Scan",
    icon: Server,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/25",
    description: "SYN scan across all ports to discover open services and vulnerabilities.",
  },
  {
    id: "brute_force" as AttackType,
    label: "Brute Force",
    icon: Square,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    description: "Repeated authentication attempts against SSH/HTTP login endpoints.",
  },
];

export default function Simulation() {
  const [attackType, setAttackType] = useState<AttackType>("normal");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);

  const { mutate: startSimulation, isPending } = useStartSimulation();
  const liveTraffic = useIDSStore(s => s.liveTraffic);
  const wsStatus = useIDSStore(s => s.wsStatus);

  const selectedConfig = ATTACK_CONFIGS.find(c => c.id === attackType)!;

  // Timer when running
  useEffect(() => {
    if (!isRunning) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed(e => {
      if (e >= duration) { clearInterval(t); return e; }
      return e + 1;
    }), 1000);
    return () => clearInterval(t);
  }, [isRunning, duration]);

  // Listen for simulation complete via WS
  useEffect(() => {
    if (jobId && elapsed >= duration) {
      setIsRunning(false);
      setLogs(prev => [...prev,
        `[${format(new Date(), "HH:mm:ss")}] [DONE] Simulation complete. ${elapsed}s elapsed.`,
        `[${format(new Date(), "HH:mm:ss")}] [STATS] Injected ~${elapsed} packets into the analysis pipeline.`,
      ]);
    }
  }, [elapsed, duration, jobId]);

  // Show live WS packets in terminal
  useEffect(() => {
    if (!isRunning || liveTraffic.length === 0) return;
    const latest = liveTraffic[0];
    if (!latest) return;
    const tag = latest.isAnomaly ? "[THREAT]" : "[NORMAL]";
    const conf = latest.confidenceScore ? ` conf:${(latest.confidenceScore * 100).toFixed(0)}%` : "";
    setLogs(prev => [
      ...prev,
      `[${format(new Date(latest.timestamp!), "HH:mm:ss.SSS")}] ${tag} ${latest.sourceIp} → ${latest.destinationIp} [${latest.protocol}] ${latest.length}B${conf} — ${latest.info}`,
    ].slice(-200));
  }, [liveTraffic.length]);

  const handleStart = () => {
    setIsRunning(true);
    setLogs([
      `[${format(new Date(), "HH:mm:ss")}] [INIT] ╔══ NIDS_PRO Attack Simulator v2.5 ══╗`,
      `[${format(new Date(), "HH:mm:ss")}] [CONF] Attack Type  : ${attackType.toUpperCase()}`,
      `[${format(new Date(), "HH:mm:ss")}] [CONF] Duration     : ${duration}s`,
      `[${format(new Date(), "HH:mm:ss")}] [CONF] Intensity    : ${intensity.toUpperCase()}`,
      `[${format(new Date(), "HH:mm:ss")}] [CONF] WS Push      : ${wsStatus === "connected" ? "ACTIVE ✓" : "POLLING"}`,
      `[${format(new Date(), "HH:mm:ss")}] [INFO] Injecting synthetic traffic into pipeline...`,
    ]);

    startSimulation({ attackType, durationSeconds: duration, intensity }, {
      onSuccess: (data: any) => {
        setJobId(data.jobId);
        setLogs(prev => [
          ...prev,
          `[${format(new Date(), "HH:mm:ss")}] [OK] Simulation job started: ${data.jobId}`,
          `[${format(new Date(), "HH:mm:ss")}] [LIVE] Streaming packets via WebSocket...`,
        ]);
      },
      onError: (err: any) => {
        setLogs(prev => [...prev, `[${format(new Date(), "HH:mm:ss")}] [ERROR] ${err.message}`]);
        setIsRunning(false);
      }
    });
  };

  const progress = isRunning ? Math.min((elapsed / duration) * 100, 100) : 0;
  const detectionCount = liveTraffic.filter(l => l.isAnomaly && isRunning).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Target className="w-7 h-7 text-primary" />
            Attack Simulation
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Inject synthetic attack traffic to test and tune IDS detection capabilities.
          </p>
        </div>

        {isRunning && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            <div>
              <div className="text-xs font-mono text-red-400 font-bold uppercase">Simulation Active</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                {elapsed}s / {duration}s · {detectionCount} detections
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Config Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Attack Type Selection */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-4">Attack Vector</div>
            <div className="grid grid-cols-2 gap-2">
              {ATTACK_CONFIGS.map((cfg) => (
                <button
                  key={cfg.id}
                  onClick={() => !isRunning && setAttackType(cfg.id)}
                  disabled={isRunning}
                  className={cn(
                    "flex flex-col items-start gap-2 p-3 rounded-xl border transition-all text-left",
                    attackType === cfg.id
                      ? `${cfg.bg} ${cfg.border} shadow-sm`
                      : "border-border hover:border-primary/30 hover:bg-muted/20",
                    isRunning && "cursor-not-allowed opacity-60"
                  )}
                >
                  <cfg.icon className={cn("w-4 h-4", attackType === cfg.id ? cfg.color : "text-muted-foreground")} />
                  <span className={cn("text-xs font-bold", attackType === cfg.id ? cfg.color : "text-muted-foreground")}>
                    {cfg.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Attack description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={attackType}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn("mt-4 p-3 rounded-lg border text-xs font-mono text-muted-foreground", selectedConfig.bg, selectedConfig.border)}
              >
                {selectedConfig.description}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Duration */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3 h-3" /> Duration
              </div>
              <span className="font-mono text-primary font-bold text-lg">{duration}s</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="10"
              value={duration}
              onChange={(e) => !isRunning && setDuration(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-primary h-2 bg-muted rounded-full appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50 mt-1.5">
              <span>10s</span><span>60s</span><span>120s</span>
            </div>
          </div>

          {/* Intensity */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-4">Intensity Level</div>
            <div className="flex bg-muted/30 p-1 rounded-lg border border-border gap-1">
              {(["low", "medium", "high"] as Intensity[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => !isRunning && setIntensity(lvl)}
                  disabled={isRunning}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all",
                    intensity === lvl
                      ? lvl === "high" ? "bg-red-500 text-white" : lvl === "medium" ? "bg-yellow-500/80 text-background" : "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    isRunning && "cursor-not-allowed"
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Launch Button + Progress */}
          <div className="space-y-3">
            <button
              onClick={handleStart}
              disabled={isPending || isRunning}
              data-testid="button-start-simulation"
              className={cn(
                "w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3",
                isRunning
                  ? "bg-muted cursor-not-allowed text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_-5px_hsla(var(--primary),0.4)]"
              )}
            >
              {isPending || isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {isRunning ? `RUNNING... ${elapsed}s / ${duration}s` : "INITIALIZING..."}
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  LAUNCH SIMULATION
                </>
              )}
            </button>

            {isRunning && (
              <div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-muted-foreground/60 mt-1">
                  <span>{progress.toFixed(0)}%</span>
                  <span>{duration - elapsed}s remaining</span>
                </div>
              </div>
            )}
          </div>

          {/* Live WS Stats */}
          {isRunning && wsStatus === "connected" && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Packets Sent", value: elapsed, color: "text-primary" },
                { label: "Detections", value: liveTraffic.filter(l => l.isAnomaly).slice(0, elapsed).length, color: "text-red-400" },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</div>
                  <div className={cn("text-xl font-bold font-mono mt-1", s.color)}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terminal */}
        <div className="lg:col-span-3">
          <Terminal logs={logs} className="h-full min-h-[520px]" />
        </div>
      </div>
    </motion.div>
  );
}
