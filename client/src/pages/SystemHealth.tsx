import { useSystemStats } from "@/hooks/use-system";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { Cpu, HardDrive, Network, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useIDSStore } from "@/store";
import { cn } from "@/lib/utils";

function MetricBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const isCritical = pct > 85;
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
      <motion.div
        className={cn("h-full rounded-full transition-all", isCritical ? "bg-red-500" : color)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ boxShadow: isCritical ? "0 0 8px #ef444466" : undefined }}
      />
    </div>
  );
}

export default function SystemHealth() {
  const { data: historicStats } = useSystemStats();
  const liveStats = useIDSStore((s) => s.statsHistory);

  const allStats = liveStats.length > 3 ? liveStats : historicStats?.slice(-40) || [];
  const latest = liveStats.length > 0 ? liveStats[liveStats.length - 1] : historicStats?.[0];

  const metricCards = [
    {
      title: "CPU USAGE",
      value: latest?.cpuUsage?.toFixed(1) || "0.0",
      unit: "%",
      icon: Cpu,
      color: "text-primary",
      barClass: "bg-primary",
      borderClass: "border-primary/20",
      bgClass: "bg-primary/10",
      iconColor: "text-primary",
      numValue: latest?.cpuUsage || 0,
    },
    {
      title: "MEMORY",
      value: latest?.memoryUsage?.toFixed(1) || "0.0",
      unit: "%",
      icon: HardDrive,
      color: "text-blue-400",
      barClass: "bg-blue-400",
      borderClass: "border-blue-500/20",
      bgClass: "bg-blue-500/10",
      iconColor: "text-blue-400",
      numValue: latest?.memoryUsage || 0,
    },
    {
      title: "THROUGHPUT",
      value: latest?.networkThroughput?.toFixed(0) || "0",
      unit: " Mbps",
      icon: Network,
      color: "text-orange-400",
      barClass: "bg-orange-400",
      borderClass: "border-orange-500/20",
      bgClass: "bg-orange-500/10",
      iconColor: "text-orange-400",
      numValue: latest?.networkThroughput || 0,
      max: 1500,
    },
    {
      title: "CONNECTIONS",
      value: latest?.activeConnections?.toString() || "0",
      unit: "",
      icon: Zap,
      color: "text-purple-400",
      barClass: "bg-purple-400",
      borderClass: "border-purple-500/20",
      bgClass: "bg-purple-500/10",
      iconColor: "text-purple-400",
      numValue: latest?.activeConnections || 0,
      max: 250,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Activity className="w-7 h-7 text-primary" />
          System Health
        </h2>
        <p className="text-muted-foreground mt-2 font-mono text-sm">
          Live resource monitoring via WebSocket push — updated every 5s.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn("bg-card border rounded-xl p-6", m.borderClass)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2.5 rounded-lg", m.bgClass)}>
                <m.icon className={cn("w-5 h-5", m.iconColor)} />
              </div>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{m.title}</span>
            </div>
            <div className={cn("text-3xl font-bold font-mono", m.color)}>
              {m.value}<span className="text-base opacity-70">{m.unit}</span>
            </div>
            <MetricBar value={m.numValue} max={m.max} color={m.barClass} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Resource History</h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-primary rounded" /> CPU</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-400 rounded" /> RAM</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-orange-400 rounded" /> Throughput</span>
          </div>
        </div>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={allStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" vertical={false} />
              <XAxis
                dataKey="recordedAt"
                tickFormatter={(t) => format(new Date(t), "HH:mm:ss")}
                stroke="#444"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0d1117", borderColor: "#1e2940", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#666" }}
                labelFormatter={(v) => format(new Date(v), "HH:mm:ss")}
              />
              <ReferenceLine y={80} stroke="#ef444466" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="cpuUsage" name="CPU %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="memoryUsage" name="RAM %" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
