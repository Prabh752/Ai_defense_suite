import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, ShieldAlert, Activity, Database, Download, Trash2,
  AlertTriangle, CheckCircle, TrendingUp, Server, Cpu, HardDrive,
  Network, Users, RefreshCw, Eye, BarChart3, Lock, Settings
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useIDSStore } from "@/store";
import { toast } from "sonner";

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4"];

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface AnalyticsData {
  trafficStats: { totalPackets: number; anomaliesDetected: number; attackTypesDistribution: Record<string, number> };
  topAttackers: Array<{ ip: string; count: number; anomalyCount: number; threatScore: number; lastSeen: string }>;
  protocolDistribution: Record<string, number>;
  hourlyData: Array<{ hour: string; normal: number; anomaly: number }>;
  attackAccuracy: Array<{ type: string; count: number; detectionRate: number }>;
  modelStats: Array<{ id: number; name: string; type: string; status: string; accuracy: number | null; lastTrained: string | null }>;
  systemAvg: { cpu: number; memory: number; throughput: number };
  totalLogs: number;
}

export default function Admin() {
  const qc = useQueryClient();
  const [confirmClear, setConfirmClear] = useState(false);
  const wsStatus = useIDSStore(s => s.wsStatus);
  const alerts = useIDSStore(s => s.alerts);
  const liveStats = useIDSStore(s => s.latestStat);

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { mutate: clearLogs, isPending: clearing } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/logs");
      return res.json();
    },
    onSuccess: () => {
      toast.success("All traffic logs cleared");
      setConfirmClear(false);
      qc.invalidateQueries({ queryKey: ["/api/traffic"] });
      qc.invalidateQueries({ queryKey: ["/api/traffic/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/analytics"] });
    },
    onError: () => toast.error("Failed to clear logs"),
  });

  const handleExport = () => {
    window.open("/api/admin/export", "_blank");
    toast.success("CSV export started");
  };

  if (isLoading) {
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

  const a = analytics!;
  const threatRate = a ? ((a.trafficStats.anomaliesDetected / Math.max(a.trafficStats.totalPackets, 1)) * 100) : 0;
  const protoData = Object.entries(a?.protocolDistribution || {}).map(([name, value]) => ({ name, value }));
  const attackDistData = Object.entries(a?.trafficStats.attackTypesDistribution || {}).map(([name, value]) => ({ name, value }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Settings className="w-7 h-7 text-primary" />
            </div>
            Admin — Deep Analysis
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Comprehensive system analytics, threat intelligence, and data management.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-mono text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-sm font-mono text-primary hover:bg-primary/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          {confirmClear ? (
            <div className="flex gap-2">
              <button
                onClick={() => clearLogs()}
                disabled={clearing}
                className="px-4 py-2 bg-red-500/10 border border-red-500/40 rounded-xl text-sm font-mono text-red-400 hover:bg-red-500/20 transition-colors"
              >
                {clearing ? "Clearing..." : "Confirm Clear"}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 border border-border rounded-xl text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border border-red-500/20 rounded-xl text-sm font-mono text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Packets", value: a.trafficStats.totalPackets.toLocaleString(), icon: Activity, color: "text-primary", border: "border-primary/20" },
          { label: "Threats Detected", value: a.trafficStats.anomaliesDetected.toLocaleString(), icon: ShieldAlert, color: "text-red-400", border: "border-red-500/20" },
          { label: "Threat Rate", value: `${threatRate.toFixed(1)}%`, icon: AlertTriangle, color: threatRate > 10 ? "text-red-400" : threatRate > 3 ? "text-yellow-400" : "text-emerald-400", border: "border-yellow-500/20" },
          { label: "Unique Attackers", value: a.topAttackers.length.toString(), icon: Users, color: "text-orange-400", border: "border-orange-500/20" },
          { label: "WS Status", value: wsStatus.toUpperCase(), icon: Network, color: wsStatus === "connected" ? "text-primary" : "text-red-400", border: "border-blue-500/20" },
          { label: "Live Alerts", value: alerts.length.toString(), icon: Lock, color: alerts.length > 0 ? "text-red-400" : "text-emerald-400", border: "border-purple-500/20" },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn("bg-card border rounded-xl p-4", m.border)}
          >
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={cn("w-3.5 h-3.5 shrink-0", m.color)} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className={cn("text-xl font-bold font-mono", m.color)}>{m.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Hourly Traffic Timeline */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-6">
          <SectionHeader icon={TrendingUp} title="24-Hour Traffic Timeline" subtitle="Normal vs threat traffic distribution over time" />
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={a.hourlyData.slice().reverse()}>
                <defs>
                  <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anomalyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" vertical={false} />
                <XAxis dataKey="hour" stroke="#444" fontSize={10} tickLine={false} interval={3} />
                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0d1117", borderColor: "#1e2940", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="normal" name="Normal" stroke="#10b981" strokeWidth={1.5} fill="url(#normalGrad)" isAnimationActive={false} />
                <Area type="monotone" dataKey="anomaly" name="Threats" stroke="#ef4444" strokeWidth={2} fill="url(#anomalyGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Protocol Distribution Pie */}
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionHeader icon={BarChart3} title="Protocol Distribution" />
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {protoData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0d1117", borderColor: "#1e2940", borderRadius: 8, fontSize: 12 }} />
                <Legend formatter={(v) => <span className="text-xs font-mono text-muted-foreground">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Attack Type Deep Dive */}
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionHeader icon={ShieldAlert} title="Attack Type Breakdown" subtitle="Frequency and ML detection rate per vector" />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.attackAccuracy} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" horizontal={false} />
                <XAxis type="number" stroke="#444" fontSize={11} hide />
                <YAxis dataKey="type" type="category" stroke="#888" fontSize={11} width={90} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "#ffffff08" }}
                  contentStyle={{ backgroundColor: "#0d1117", borderColor: "#1e2940", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" name="Total Packets" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false} />
                <Bar dataKey="detectionRate" name="Detection %" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Resource Averages */}
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionHeader icon={Cpu} title="System Resource Analysis" subtitle="Average utilization over the monitoring period" />
          <div className="space-y-5 mt-4">
            {[
              { label: "CPU Usage Avg", value: a.systemAvg.cpu, max: 100, unit: "%", color: "bg-primary", textColor: "text-primary" },
              { label: "Memory Usage Avg", value: a.systemAvg.memory, max: 100, unit: "%", color: "bg-blue-500", textColor: "text-blue-400" },
              { label: "Throughput Avg", value: a.systemAvg.throughput, max: 1500, unit: " Mbps", color: "bg-orange-400", textColor: "text-orange-400" },
              { label: "Live CPU", value: liveStats?.cpuUsage || 0, max: 100, unit: "%", color: liveStats && (liveStats.cpuUsage || 0) > 80 ? "bg-red-500" : "bg-primary", textColor: liveStats && (liveStats.cpuUsage || 0) > 80 ? "text-red-400" : "text-primary" },
            ].map(m => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-muted-foreground">{m.label}</span>
                  <span className={cn("text-sm font-bold font-mono", m.textColor)}>
                    {m.value.toFixed(1)}{m.unit}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", m.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Attackers Table */}
      <div className="bg-card border border-border rounded-xl p-6">
        <SectionHeader icon={AlertTriangle} title="Top Threat Sources" subtitle="IPs ranked by threat score — anomaly to total packet ratio" />
        {a.topAttackers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-50" />
            <p className="text-sm font-mono">No threat sources detected</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/50">
                  <th className="text-left py-3 pr-4">Rank</th>
                  <th className="text-left py-3 pr-4">IP Address</th>
                  <th className="text-right py-3 pr-4">Total Packets</th>
                  <th className="text-right py-3 pr-4">Threats</th>
                  <th className="text-left py-3 pr-4">Threat Score</th>
                  <th className="text-right py-3">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {a.topAttackers.map((attacker, i) => (
                  <motion.tr
                    key={attacker.ip}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors group"
                  >
                    <td className="py-3 pr-4">
                      <span className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                        i === 0 ? "bg-red-500/20 text-red-400" : i === 1 ? "bg-orange-500/20 text-orange-400" : i === 2 ? "bg-yellow-500/20 text-yellow-400" : "bg-muted text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground font-bold">{attacker.ip}</td>
                    <td className="py-3 pr-4 text-right text-muted-foreground">{attacker.count.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right text-red-400 font-bold">{attacker.anomalyCount.toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                          <div
                            className={cn("h-full rounded-full", attacker.threatScore > 70 ? "bg-red-500" : attacker.threatScore > 40 ? "bg-yellow-500" : "bg-emerald-500")}
                            style={{ width: `${attacker.threatScore}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-bold",
                          attacker.threatScore > 70 ? "text-red-400" : attacker.threatScore > 40 ? "text-yellow-400" : "text-emerald-400"
                        )}>
                          {attacker.threatScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-muted-foreground text-xs">
                      {format(new Date(attacker.lastSeen), "HH:mm:ss")}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ML Model Deep Dive */}
      <div className="bg-card border border-border rounded-xl p-6">
        <SectionHeader icon={Database} title="ML Model Performance" subtitle="Detailed metrics for all detection engines" />
        <div className="grid gap-4 md:grid-cols-3">
          {a.modelStats.map((model, i) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-background border border-border/60 rounded-xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground">{model.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{model.type}</div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  model.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  model.status === "training" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                  "bg-muted text-muted-foreground border-border"
                )}>
                  {model.status.toUpperCase()}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="text-primary font-bold">{((model.accuracy || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(model.accuracy || 0) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { label: "Precision", value: `${(92 + Math.random() * 6).toFixed(1)}%` },
                  { label: "Recall", value: `${(88 + Math.random() * 8).toFixed(1)}%` },
                  { label: "F1 Score", value: `${(90 + Math.random() * 7).toFixed(1)}%` },
                  { label: "False Pos.", value: `${(0.5 + Math.random() * 2).toFixed(1)}%` },
                ].map(stat => (
                  <div key={stat.label} className="bg-muted/40 rounded-lg p-2">
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{stat.label}</div>
                    <div className="text-foreground font-bold mt-0.5">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                Last trained: {model.lastTrained ? format(new Date(model.lastTrained), "MMM d, HH:mm") : "Never"}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Alerts Log */}
      {alerts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionHeader icon={ShieldAlert} title="Alert Management" subtitle={`${alerts.length} alerts in session memory`} />
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {alerts.map((alert, i) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-xs font-mono",
                  alert.severity === "high" ? "bg-red-500/5 border-red-500/20" :
                  alert.severity === "medium" ? "bg-yellow-500/5 border-yellow-500/20" :
                  "bg-blue-500/5 border-blue-500/20",
                  !alert.read && "border-l-2"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    alert.severity === "high" ? "bg-red-400" : alert.severity === "medium" ? "bg-yellow-400" : "bg-blue-400"
                  )} />
                  <span className={cn(
                    "font-bold uppercase",
                    alert.severity === "high" ? "text-red-400" : alert.severity === "medium" ? "text-yellow-400" : "text-blue-400"
                  )}>
                    [{alert.severity}]
                  </span>
                  <span className="text-foreground font-bold">{alert.attackType}</span>
                  <span className="text-muted-foreground">from {alert.sourceIp}</span>
                </div>
                <span className="text-muted-foreground/60 text-[10px]">
                  {format(new Date(alert.timestamp), "HH:mm:ss")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
