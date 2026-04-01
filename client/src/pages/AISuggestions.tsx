import { useState, useRef, useCallback, useEffect } from "react";
import {
  Brain, Send, RefreshCw, Sparkles, ShieldAlert, Lightbulb,
  AlertTriangle, CheckCircle, Zap, Copy, Download, TrendingUp,
  Eye, Lock, Globe, MessageSquare, Cpu, ChevronRight, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useIDSStore } from "@/store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Suggestion = {
  id: string;
  question: string | null;
  response: string;
  timestamp: Date;
  riskLevel: string;
};

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-primary mt-5 mb-2 flex items-center gap-2 border-l-2 border-primary/40 pl-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-foreground mt-7 mb-3 pb-2 border-b border-border/60">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-primary mt-4 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-primary font-mono text-xs">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="flex gap-2 text-sm text-muted-foreground ml-4 mb-1.5 leading-relaxed"><span class="text-primary mt-1 shrink-0 text-base leading-none">›</span><span>$1</span></li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="flex gap-2 text-sm text-muted-foreground ml-4 mb-1.5 leading-relaxed"><span class="text-primary font-mono font-bold w-5 shrink-0">$1.</span><span>$2</span></li>')
    .replace(/\n\n/g, '<div class="mb-4"></div>')
    .replace(/\n/g, '<br/>');
}

const CATEGORIES = [
  {
    id: "threat",
    label: "Threat Assessment",
    icon: ShieldAlert,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    prompt: "Perform a full threat assessment. What is the current risk level, which attack types are most active, and what is the immediate danger to our infrastructure?",
  },
  {
    id: "actions",
    label: "Immediate Actions",
    icon: Zap,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    prompt: "What immediate defensive actions should I take right now based on the active threats? Provide step-by-step prioritized response actions.",
  },
  {
    id: "ml",
    label: "ML Optimization",
    icon: Cpu,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    prompt: "Analyze the ML model performance. Which models are performing sub-optimally? How can I improve detection accuracy for each attack type?",
  },
  {
    id: "network",
    label: "Network Hardening",
    icon: Lock,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    prompt: "Recommend specific network hardening measures — firewall rules, rate limiting, IP blocking, and protocol restrictions based on the observed attack patterns.",
  },
  {
    id: "ddos",
    label: "DDoS Analysis",
    icon: Globe,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    prompt: "Analyze the DDoS traffic patterns. Identify source IPs, attack vectors, and recommend mitigation strategies including traffic scrubbing and rate limiting.",
  },
  {
    id: "forecast",
    label: "Risk Forecast",
    icon: TrendingUp,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    prompt: "Based on current attack patterns and trends, forecast the likely next attack vectors. What should we prepare for in the next 24-48 hours?",
  },
  {
    id: "forensics",
    label: "Forensics",
    icon: Eye,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    prompt: "Perform a forensic analysis of recent anomalies. Identify attack chains, suspicious IP behavior, and provide evidence-based conclusions.",
  },
  {
    id: "report",
    label: "Executive Report",
    icon: Lightbulb,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    prompt: "Generate a concise executive security report — current posture, key threats, business impact, and top 3 recommendations. Keep it non-technical and clear.",
  },
];

export default function AISuggestions() {
  const [question, setQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [history, setHistory] = useState<Suggestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: trafficStats } = useQuery<{ totalPackets: number; anomaliesDetected: number }>({
    queryKey: ["/api/traffic/stats"],
  });

  const liveAlerts = useIDSStore(s => s.alerts);
  const wsStatus = useIDSStore(s => s.wsStatus);
  const unreadAlerts = useIDSStore(s => s.unreadCount);

  const threatRate = trafficStats
    ? ((trafficStats.anomaliesDetected / Math.max(trafficStats.totalPackets, 1)) * 100).toFixed(1)
    : "0.0";
  const riskLevel = parseFloat(threatRate) > 10 ? "HIGH" : parseFloat(threatRate) > 3 ? "MEDIUM" : "LOW";
  const riskColor = riskLevel === "HIGH" ? "text-red-400" : riskLevel === "MEDIUM" ? "text-yellow-400" : "text-emerald-400";
  const riskBg = riskLevel === "HIGH" ? "bg-red-500/10 border-red-500/30" : riskLevel === "MEDIUM" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-emerald-500/10 border-emerald-500/30";

  const runAnalysis = useCallback(async (q: string | null, categoryId?: string) => {
    if (isStreaming) {
      abortRef.current?.abort();
      return;
    }

    setIsStreaming(true);
    setStreamedText("");
    setCurrentQuestion(q);
    setActiveCategory(categoryId || null);
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q || undefined }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Request failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.error) { toast({ title: "AI Error", description: evt.error, variant: "destructive" }); break; }
            if (evt.content) { fullText += evt.content; setStreamedText(fullText); }
            if (evt.done) {
              setHistory(prev => [{
                id: Date.now().toString(),
                question: q,
                response: fullText,
                timestamp: new Date(),
                riskLevel,
              }, ...prev.slice(0, 9)]);
            }
          } catch (_) {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: "Connection Error", description: "Could not reach AI service.", variant: "destructive" });
      }
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, toast, riskLevel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(streamedText.replace(/<[^>]+>/g, ""));
    toast({ title: "Copied to clipboard", duration: 2000 });
  };

  const handleDownload = () => {
    const blob = new Blob([streamedText.replace(/<[^>]+>/g, "")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nids-analysis-${format(new Date(), "yyyyMMdd-HHmm")}.txt`;
    a.click();
  };

  // Auto-scroll response box as text streams in
  useEffect(() => {
    if (responseRef.current && isStreaming) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamedText, isStreaming]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            SENTINEL-AI Advisor
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            AI security analyst with live access to your network telemetry, threat events, and ML model outputs.
          </p>
        </div>

        <div className="flex gap-3">
          <div className={cn("rounded-xl px-5 py-3 border text-center", riskBg)}>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Risk Level</div>
            <div className={cn("text-2xl font-bold font-mono", riskColor)}>{riskLevel}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{threatRate}% threat rate</div>
          </div>

          {unreadAlerts > 0 && (
            <div className="rounded-xl px-5 py-3 border bg-red-500/10 border-red-500/30 text-center">
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Alerts</div>
              <div className="text-2xl font-bold font-mono text-red-400">{unreadAlerts}</div>
              <div className="text-[10px] text-muted-foreground mt-1">unread</div>
            </div>
          )}

          <div className={cn(
            "rounded-xl px-4 py-3 border text-center",
            wsStatus === "connected" ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border"
          )}>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Context</div>
            <div className={cn("text-sm font-bold font-mono", wsStatus === "connected" ? "text-primary" : "text-muted-foreground")}>
              {wsStatus === "connected" ? "LIVE" : "STATIC"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">data feed</div>
          </div>
        </div>
      </div>

      {/* Live Threat Ticker */}
      {liveAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
        >
          <div className="text-xs font-mono text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Active Threat Feed ({liveAlerts.length} events)
            <button
              onClick={() => runAnalysis("Analyze these recent threats and tell me what is happening and what I should do immediately.", "actions")}
              disabled={isStreaming}
              className="ml-auto flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 border border-red-500/30 rounded px-2 py-0.5 transition-colors"
            >
              <Brain className="w-3 h-3" /> Analyze Now
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {liveAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2",
                alert.severity === "high" ? "bg-red-500/10 border-red-500/25 text-red-400" :
                alert.severity === "medium" ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-400" :
                "bg-blue-500/10 border-blue-500/25 text-blue-400"
              )}>
                <ShieldAlert className="w-3 h-3 shrink-0" />
                <span className="font-bold">{alert.attackType}</span>
                <span className="opacity-70">{alert.sourceIp}</span>
                <span className="opacity-50 uppercase">[{alert.severity}]</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analysis Categories */}
      <div>
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Quick Analysis</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => runAnalysis(cat.prompt, cat.id)}
              disabled={isStreaming}
              data-testid={`prompt-${cat.id}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                activeCategory === cat.id && !isStreaming
                  ? `${cat.bg} ${cat.border}`
                  : "bg-card border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div className={cn("p-1.5 rounded-lg shrink-0", cat.bg)}>
                <cat.icon className={cn("w-3.5 h-3.5", cat.color)} />
              </div>
              <span className="text-xs font-medium text-foreground leading-tight">{cat.label}</span>
              {isStreaming && activeCategory === cat.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom Question Input */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Custom Question</span>
          <span className="text-xs text-muted-foreground">(or leave empty for full analysis)</span>
        </div>
        <div className="flex gap-3">
          <Textarea
            data-testid="input-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { runAnalysis(question.trim() || null); setQuestion(""); } }}
            placeholder="e.g. Why am I seeing repeated SYN packets from 45.33.22.11? Should I block this IP?"
            className="flex-1 bg-background border-border font-mono text-sm resize-none h-16"
            disabled={isStreaming}
          />
          <div className="flex flex-col gap-2">
            {isStreaming ? (
              <Button
                data-testid="button-stop"
                variant="outline"
                size="sm"
                onClick={() => abortRef.current?.abort()}
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-full px-4"
              >
                <div className="w-3 h-3 bg-red-400 rounded-sm" />
              </Button>
            ) : (
              <Button
                data-testid="button-analyze"
                onClick={() => { runAnalysis(question.trim() || null); setQuestion(""); }}
                disabled={isStreaming}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-full px-5"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2 font-mono">Ctrl+Enter to submit</div>
      </div>

      {/* AI Response */}
      <AnimatePresence>
        {(isStreaming || streamedText) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-primary/25 rounded-xl overflow-hidden"
            style={{ boxShadow: "0 0 30px -10px hsl(var(--primary) / 0.15)" }}
          >
            {/* Response Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-primary/5">
              <div className="p-1.5 bg-primary/20 rounded-lg">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold font-mono text-primary uppercase tracking-wider">SENTINEL-AI Analysis</div>
                {currentQuestion && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {currentQuestion.slice(0, 80)}{currentQuestion.length > 80 ? "..." : ""}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isStreaming ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <div className="flex gap-0.5">
                      {[0, 150, 300].map(d => (
                        <div key={d} className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-primary">Analyzing</span>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" /> Complete
                  </Badge>
                )}

                {!isStreaming && streamedText && (
                  <>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy response"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                      title="Download as text"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => runAnalysis(currentQuestion, activeCategory || undefined)}
                      className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                      title="Re-run analysis"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Response Body */}
            <div
              ref={responseRef}
              data-testid="ai-response"
              className="px-6 py-5 text-sm leading-relaxed overflow-y-auto"
              style={{ maxHeight: "65vh" }}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(streamedText) }}
            />

            {/* Token progress bar while streaming */}
            {isStreaming && (
              <div className="h-0.5 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <RefreshCw className="w-3 h-3" /> Analysis History ({history.length - 1})
          </div>
          <div className="space-y-2">
            {history.slice(1).map(item => (
              <motion.div
                key={item.id}
                whileHover={{ x: 2 }}
                data-testid={`history-${item.id}`}
                className="flex items-center gap-4 bg-card border border-border/60 rounded-lg p-3.5 cursor-pointer hover:border-primary/30 transition-colors group"
                onClick={() => { setStreamedText(item.response); setCurrentQuestion(item.question); }}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  item.riskLevel === "HIGH" ? "bg-red-400" : item.riskLevel === "MEDIUM" ? "bg-yellow-400" : "bg-emerald-400"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-primary truncate">
                    {item.question ? `"${item.question}"` : "Full System Analysis"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {item.response.replace(/<[^>]+>/g, "").slice(0, 100)}...
                  </div>
                </div>
                <div className="text-xs text-muted-foreground shrink-0 font-mono">
                  {format(item.timestamp, "HH:mm")}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
