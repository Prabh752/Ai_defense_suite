import { useTrafficStats } from "@/hooks/use-traffic";
import { useSystemStats } from "@/hooks/use-system";
import { StatCard } from "@/components/StatCard";
import { Activity, ShieldCheck, ShieldAlert, Wifi, Server, Database, Radio, Bell } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useIDSStore } from "@/store";
import { cn } from "@/lib/utils";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" },
  }),
};

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6"];

export default function Dashboard() {
  const { data: trafficStats, isLoading: loadingTraffic } = useTrafficStats();
  const { data: historicStats } = useSystemStats();
  const wsStatus = useIDSStore((s) => s.wsStatus);
  const liveStats = useIDSStore((s) => s.statsHistory);
  const alerts = useIDSStore((s) => s.alerts);
  const unreadCount = useIDSStore((s) => s.unreadCount);
  const markAllRead = useIDSStore((s) => s.markAllRead);

  // Prefer WS live stats if available, else fall back to HTTP-polled
  const statsData = liveStats.length > 2 ? liveStats : historicStats?.slice(-30) || [];
  const latestStat = liveStats.length > 0 ? liveStats[liveStats.length - 1] : historicStats?.[0];

  const attackData = Object.entries(trafficStats?.attackTypesDistribution || {}).map(([name, value]) => ({ name, value }));

  if (loadingTraffic) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-glow">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm flex items-center gap-2">
            {wsStatus === "connected" ? (
              <>
                <Radio className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-primary">WebSocket LIVE</span> — real-time push active
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400">Polling mode</span> — WebSocket connecting...
              </>
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-mono hover:bg-destructive/20 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount} new alert{unreadCount !== 1 ? "s" : ""}
          </motion.button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Packets",
            value: (trafficStats?.totalPackets || 0).toLocaleString(),
            icon: <Activity className="w-4 h-4" />,
            trend: "12%",
            trendUp: true,
          },
          {
            title: "Threats Detected",
            value: trafficStats?.anomaliesDetected || 0,
            icon: <ShieldAlert className="w-4 h-4" />,
            variant: trafficStats?.anomaliesDetected > 0 ? "danger" : "default",
            trend: "2%",
            trendUp: false,
          },
          {
            title: "Network Throughput",
            value: `${trafficStats?.throughput || 0} Mbps`,
            icon: <Wifi className="w-4 h-4" />,
            variant: "success",
          },
          {
            title: "Active Models",
            value: "3/3",
            icon: <Database className="w-4 h-4" />,
          },
        ].map((card, i) => (
          <motion.div key={card.title} custom={i} variants={cardVariants} initial="hidden" animate="show">
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* System Stats Row */}
      {latestStat && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-3 grid-cols-3"
        >
          {[
            { label: "CPU", value: latestStat.cpuUsage?.toFixed(1) + "%", color: "text-primary", bar: (latestStat.cpuUsage || 0) / 100 },
            { label: "MEMORY", value: latestStat.memoryUsage?.toFixed(1) + "%", color: "text-blue-400", bar: (latestStat.memoryUsage || 0) / 100 },
            { label: "CONNECTIONS", value: latestStat.activeConnections?.toString() || "0", color: "text-orange-400", bar: Math.min((latestStat.activeConnections || 0) / 250, 1) },
          ].map(({ label, value, color, bar }) => (
            <div key={label} className="bg-card border border-border rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className={cn("font-mono font-bold text-lg", color)}>{value}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
                  initial={{ width: 0 }}
                  animate={{ width: `${bar * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-7">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-4 bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Network Throughput (Live)</h3>
            <Wifi className="w-4 h-4 text-primary" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" vertical={false} />
                <XAxis
                  dataKey="recordedAt"
                  tickFormatter={(t) => format(new Date(t), "HH:mm")}
                  stroke="#444"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0d1117", borderColor: "#1e2940", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#666" }}
                  formatter={(v: number) => [`${v.toFixed(0)} Mbps`, "Throughput"]}
                />
                <Area
                  type="monotone"
                  dataKey="networkThroughput"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorThroughput)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="col-span-3 bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Attack Distribution</h3>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" horizontal={false} />
                <XAxis type="number" stroke="#444" fontSize={11} hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#888"
                  fontSize={11}
                  width={90}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ backgroundColor: "#0d1117", borderColor: "#1e2940", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28} isAnimationActive={false}>
                  {attackData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === "Normal" ? COLORS[0] : COLORS[1 + (index % 3)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Alerts Panel */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-destructive" />
              Recent Alerts
            </h3>
            <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Mark all read
            </button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-sm font-mono",
                  alert.severity === "high"
                    ? "bg-red-500/5 border-red-500/20 text-red-400"
                    : alert.severity === "medium"
                    ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-400"
                    : "bg-blue-500/5 border-blue-500/20 text-blue-400",
                  !alert.read && "border-l-2"
                )}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-bold">{alert.attackType}</span>
                  <span className="opacity-70">from {alert.sourceIp}</span>
                </div>
                <div className="flex items-center gap-2 opacity-60 text-xs">
                  <span className="uppercase">{alert.severity}</span>
                  <span>{format(new Date(alert.timestamp), "HH:mm:ss")}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
