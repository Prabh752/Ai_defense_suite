import { useTrafficStats } from "@/hooks/use-traffic";
import { useSystemStats } from "@/hooks/use-system";
import { StatCard } from "@/components/StatCard";
import { Activity, ShieldCheck, ShieldAlert, Wifi, Server, Database } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: trafficStats, isLoading: loadingTraffic } = useTrafficStats();
  const { data: systemStats, isLoading: loadingSystem } = useSystemStats();

  if (loadingTraffic || loadingSystem) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const attackData = Object.entries(trafficStats?.attackTypesDistribution || {}).map(([name, value]) => ({
    name, value
  }));

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-glow">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2 font-mono text-sm">
          Live monitoring and threat detection system active.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Packets"
          value={trafficStats?.totalPackets || 0}
          icon={<Activity className="w-4 h-4" />}
          trend="12%"
          trendUp={true}
        />
        <StatCard
          title="Threats Detected"
          value={trafficStats?.anomaliesDetected || 0}
          icon={<ShieldAlert className="w-4 h-4" />}
          variant={trafficStats?.anomaliesDetected > 0 ? "danger" : "default"}
          trend="2%"
          trendUp={false}
        />
        <StatCard
          title="Network Throughput"
          value={`${trafficStats?.throughput || 0} Mbps`}
          icon={<Wifi className="w-4 h-4" />}
          variant="success"
        />
        <StatCard
          title="Active Models"
          value="3/3"
          icon={<Database className="w-4 h-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Network Traffic Volume</h3>
            <Wifi className="w-4 h-4 text-primary" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemStats?.slice(-20) || []}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                <Area 
                  type="monotone" 
                  dataKey="networkThroughput" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorThroughput)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Attack Distribution</h3>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#666" fontSize={12} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#888" 
                  fontSize={12} 
                  width={100}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {attackData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Normal' ? COLORS[0] : COLORS[1]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
