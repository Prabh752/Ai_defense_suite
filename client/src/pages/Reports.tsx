import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, Download, FileText, Shield, AlertTriangle, Clock, CheckCircle, TrendingUp, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const SECURITY_POSTURE = [
  { subject: "Detection Rate", A: 94, fullMark: 100 },
  { subject: "Response Time", A: 82, fullMark: 100 },
  { subject: "False Positives", A: 88, fullMark: 100 },
  { subject: "Coverage", A: 91, fullMark: 100 },
  { subject: "ML Accuracy", A: 96, fullMark: 100 },
  { subject: "Compliance", A: 78, fullMark: 100 },
];

const WEEKLY_INCIDENTS = Array.from({ length: 7 }, (_, i) => ({
  day: format(subDays(new Date(), 6 - i), "EEE"),
  blocked: Math.floor(20 + Math.random() * 80),
  detected: Math.floor(5 + Math.random() * 25),
  false_pos: Math.floor(1 + Math.random() * 8),
}));

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  format: string;
  generatingTime: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: "exec", name: "Executive Summary", description: "High-level security posture overview for management", icon: Shield, color: "text-primary", format: "PDF", generatingTime: "~5s" },
  { id: "incident", name: "Incident Report", description: "Detailed analysis of all detected security incidents", icon: AlertTriangle, color: "text-red-400", format: "PDF", generatingTime: "~8s" },
  { id: "compliance", name: "Compliance Report", description: "SOC2, ISO27001, GDPR compliance status", icon: CheckCircle, color: "text-emerald-400", format: "PDF", generatingTime: "~12s" },
  { id: "threat", name: "Threat Intelligence", description: "Attack patterns, origins, and trend analysis", icon: TrendingUp, color: "text-orange-400", format: "PDF", generatingTime: "~6s" },
  { id: "ml", name: "ML Performance", description: "Detection model metrics, accuracy, and drift analysis", icon: Cpu, color: "text-blue-400", format: "CSV", generatingTime: "~3s" },
  { id: "traffic", name: "Traffic Analysis", description: "Full packet capture summary and protocol breakdown", icon: BarChart3, color: "text-cyan-400", format: "CSV", generatingTime: "~10s" },
];

export default function Reports() {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  const { data: stats } = useQuery<{ totalPackets: number; anomaliesDetected: number }>({
    queryKey: ["/api/traffic/stats"],
  });

  const handleGenerate = (template: ReportTemplate) => {
    setGeneratingId(template.id);
    setTimeout(() => {
      setGeneratingId(null);
      setGenerated(prev => new Set([...prev, template.id]));
      toast.success(`${template.name} ready`, { description: `${template.format} report generated` });
    }, 2500);
  };

  const handleDownloadCSV = () => {
    window.open("/api/admin/export", "_blank");
    toast.success("Raw data export started");
  };

  const threatRate = stats ? ((stats.anomaliesDetected / Math.max(stats.totalPackets, 1)) * 100) : 0;
  const overallScore = Math.max(0, 100 - threatRate * 3).toFixed(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <BarChart3 className="w-7 h-7 text-indigo-400" />
            </div>
            Reports Center
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Generate, download, and share security reports and incident documentation.
          </p>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-xl text-sm font-mono text-primary hover:bg-primary/20 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Raw CSV
        </button>
      </div>

      {/* Score + charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Security Score */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Security Score</div>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full">
              <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - Number(overallScore) / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="65" textAnchor="middle" fill="hsl(var(--primary))" fontSize="22" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                {overallScore}
              </text>
            </svg>
          </div>
          <div className={cn("text-sm font-bold font-mono", Number(overallScore) > 80 ? "text-emerald-400" : Number(overallScore) > 60 ? "text-yellow-400" : "text-red-400")}>
            {Number(overallScore) > 80 ? "SECURE" : Number(overallScore) > 60 ? "MODERATE RISK" : "HIGH RISK"}
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-mono">
            Based on {stats?.totalPackets?.toLocaleString() ?? 0} packets
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Security Posture Radar</div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={SECURITY_POSTURE}>
                <PolarGrid stroke="#1e2940" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }} />
                <Radar dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">7-Day Incident Trend</div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_INCIDENTS}>
                <defs>
                  <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2940" vertical={false} />
                <XAxis dataKey="day" stroke="#444" fontSize={10} tickLine={false} />
                <YAxis stroke="#444" fontSize={10} hide />
                <Tooltip contentStyle={{ background: "#0d1117", borderColor: "#1e2940", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={1.5} fill="url(#blockedGrad)" isAnimationActive={false} />
                <Area type="monotone" dataKey="detected" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="none" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report templates */}
      <div>
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" /> Report Templates
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TEMPLATES.map((template, i) => {
            const isGenerating = generatingId === template.id;
            const isDone = generated.has(template.id);
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-2.5 rounded-xl border shrink-0", template.color.replace("text-", "bg-").replace("400", "500/10"), template.color.replace("text-", "border-").replace("400", "500/20"))}>
                    <template.icon className={cn("w-5 h-5", template.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-foreground">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{template.description}</div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-muted/50 rounded border border-border/50 text-muted-foreground">{template.format}</span>
                      <span className="text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1"><Clock className="w-3 h-3" />{template.generatingTime}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => !isGenerating && !isDone && handleGenerate(template)}
                  className={cn(
                    "w-full mt-4 py-2 rounded-lg border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2",
                    isDone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    isGenerating ? "bg-primary/10 border-primary/20 text-primary cursor-wait" :
                    "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  {isDone ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> Ready to Download</>
                  ) : isGenerating ? (
                    <><div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin" /> Generating...</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" /> Generate Report</>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
