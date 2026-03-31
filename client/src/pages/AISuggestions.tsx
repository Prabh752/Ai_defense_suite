import { useState, useRef, useCallback } from "react";
import { Brain, Send, RefreshCw, Sparkles, ShieldAlert, Lightbulb, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

type Suggestion = {
  id: string;
  question: string | null;
  response: string;
  timestamp: Date;
};

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-primary mt-4 mb-2 flex items-center gap-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-foreground mt-6 mb-3 border-b border-border pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-primary mt-4 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="flex gap-2 text-sm text-muted-foreground ml-2 mb-1"><span class="text-primary mt-1 shrink-0">›</span><span>$1</span></li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="flex gap-2 text-sm text-muted-foreground ml-2 mb-1"><span class="text-primary font-mono w-4 shrink-0">$1.</span><span>$2</span></li>')
    .replace(/\n\n/g, '<div class="mb-3"></div>')
    .replace(/\n/g, '<br/>');
}

const QUICK_PROMPTS = [
  { label: "Threat Assessment", icon: ShieldAlert, prompt: "What is the current threat level and which attack types pose the highest risk?" },
  { label: "Model Tuning", icon: Brain, prompt: "How can I improve my ML model accuracy for better anomaly detection?" },
  { label: "Immediate Actions", icon: Zap, prompt: "What immediate actions should I take based on the current threat events?" },
  { label: "Network Hardening", icon: ShieldAlert, prompt: "Suggest specific firewall rules and network configurations to reduce attack surface." },
  { label: "DDoS Mitigation", icon: AlertTriangle, prompt: "How do I configure the system to better detect and mitigate DDoS attacks?" },
  { label: "Security Report", icon: Lightbulb, prompt: "Generate a concise executive summary of the current security posture." },
];

export default function AISuggestions() {
  const [question, setQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [history, setHistory] = useState<Suggestion[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const { data: trafficStats } = useQuery<{ totalPackets: number; anomaliesDetected: number }>({
    queryKey: ["/api/traffic/stats"],
  });

  const runAnalysis = useCallback(async (q: string | null) => {
    if (isStreaming) {
      abortRef.current?.abort();
      return;
    }

    setIsStreaming(true);
    setStreamedText("");
    setCurrentQuestion(q);

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
            if (evt.error) {
              toast({ title: "AI Error", description: evt.error, variant: "destructive" });
              break;
            }
            if (evt.content) {
              fullText += evt.content;
              setStreamedText(fullText);
            }
            if (evt.done) {
              setHistory(prev => [{
                id: Date.now().toString(),
                question: q,
                response: fullText,
                timestamp: new Date(),
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
  }, [isStreaming, toast]);

  const handleSubmit = () => {
    const q = question.trim() || null;
    setQuestion("");
    runAnalysis(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const threatRate = trafficStats
    ? ((trafficStats.anomaliesDetected / Math.max(trafficStats.totalPackets, 1)) * 100).toFixed(1)
    : "0.0";

  const riskLevel = parseFloat(threatRate) > 10 ? "HIGH" : parseFloat(threatRate) > 3 ? "MEDIUM" : "LOW";
  const riskColor = riskLevel === "HIGH" ? "text-red-400" : riskLevel === "MEDIUM" ? "text-yellow-400" : "text-green-400";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-glow flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            AI Security Advisor
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Real-time AI analysis powered by your live network data and ML model outputs.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-right">
          <div className="text-xs text-muted-foreground font-mono mb-1">CURRENT RISK LEVEL</div>
          <div className={`text-2xl font-bold font-mono ${riskColor}`} data-testid="risk-level">{riskLevel}</div>
          <div className="text-xs text-muted-foreground mt-1">{threatRate}% threat rate</div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        {QUICK_PROMPTS.map(({ label, icon: Icon, prompt }) => (
          <button
            key={label}
            data-testid={`quick-prompt-${label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => runAnalysis(prompt)}
            disabled={isStreaming}
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg text-left text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Ask the AI Analyst</h3>
          <span className="text-xs text-muted-foreground">(leave blank for full analysis)</span>
        </div>

        <Textarea
          data-testid="input-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a specific security question... e.g. 'Why am I seeing port scan activity from 192.168.1.x?'"
          className="bg-background border-border font-mono text-sm resize-none min-h-[80px] focus:border-primary/50"
          disabled={isStreaming}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">Ctrl+Enter to submit</span>
          <div className="flex gap-2">
            {isStreaming && (
              <Button
                data-testid="button-stop"
                variant="outline"
                size="sm"
                onClick={() => abortRef.current?.abort()}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Stop
              </Button>
            )}
            <Button
              data-testid="button-analyze"
              onClick={handleSubmit}
              disabled={isStreaming}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isStreaming ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {(isStreaming || streamedText) && (
        <div className="bg-card border border-primary/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-primary/5">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary font-mono">AI ANALYSIS</span>
            {currentQuestion && (
              <span className="text-xs text-muted-foreground ml-2 truncate">— {currentQuestion}</span>
            )}
            {isStreaming && (
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            {!isStreaming && streamedText && (
              <Badge variant="outline" className="ml-auto text-green-400 border-green-400/30 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" /> Complete
              </Badge>
            )}
          </div>
          <div
            data-testid="ai-response"
            className="px-6 py-5 text-sm leading-relaxed max-h-[600px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(streamedText) }}
          />
        </div>
      )}

      {history.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground font-mono uppercase tracking-wider">
            Analysis History
          </h3>
          {history.slice(1).map(item => (
            <div
              key={item.id}
              data-testid={`history-item-${item.id}`}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => {
                setStreamedText(item.response);
                setCurrentQuestion(item.question);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-primary">
                  {item.question ? `"${item.question.slice(0, 60)}${item.question.length > 60 ? '...' : ''}"` : "Full System Analysis"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {item.response.replace(/<[^>]+>/g, "").slice(0, 150)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
