import { useSystemStats } from "@/hooks/use-system";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Cpu, HardDrive, Network } from "lucide-react";

export default function SystemHealth() {
  const { data: stats, isLoading } = useSystemStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const latest = stats?.[stats.length - 1];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
        <p className="text-muted-foreground mt-2 font-mono text-sm">
          Server resource monitoring and performance metrics.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Cpu className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-mono">CPU USAGE</p>
            <p className="text-3xl font-bold font-mono text-glow">
              {latest?.cpuUsage?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-4 bg-blue-500/10 rounded-full">
            <HardDrive className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-mono">MEMORY USAGE</p>
            <p className="text-3xl font-bold font-mono text-glow-blue">
              {latest?.memoryUsage?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl flex items-center gap-4">
          <div className="p-4 bg-orange-500/10 rounded-full">
            <Network className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-mono">CONNECTIONS</p>
            <p className="text-3xl font-bold font-mono">
              {latest?.activeConnections || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-medium mb-6">Resource Usage History</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.slice(-30) || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="recordedAt" 
                tickFormatter={(t) => format(new Date(t), "HH:mm:ss")} 
                stroke="#666" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                labelStyle={{ color: '#888' }}
              />
              <Line 
                type="monotone" 
                dataKey="cpuUsage" 
                name="CPU %"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="memoryUsage" 
                name="RAM %"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
