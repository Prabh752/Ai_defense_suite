import { useState } from "react";
import { useStartSimulation } from "@/hooks/use-simulation";
import { Terminal } from "@/components/Terminal";
import { Play, Square, Zap, Server, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type AttackType = "ddos" | "port_scan" | "brute_force" | "normal";
type Intensity = "low" | "medium" | "high";

export default function Simulation() {
  const [attackType, setAttackType] = useState<AttackType>("normal");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<Intensity>("medium");
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const { mutate: startSimulation, isPending } = useStartSimulation();
  const { toast } = useToast();

  const handleStart = () => {
    setIsRunning(true);
    setLogs(prev => [...prev, `[INIT] Starting ${attackType.toUpperCase()} simulation...`]);
    setLogs(prev => [...prev, `[CONF] Duration: ${duration}s, Intensity: ${intensity.toUpperCase()}`]);
    
    startSimulation({
      attackType,
      durationSeconds: duration,
      intensity
    }, {
      onSuccess: (data) => {
        setLogs(prev => [...prev, `[SUCCESS] Job started: ${data.jobId}`]);
        toast({
          title: "Simulation Started",
          description: `Generating ${attackType} traffic for ${duration}s`,
        });
        
        // Simulate some logs appearing
        let count = 0;
        const interval = setInterval(() => {
          count++;
          setLogs(prev => [...prev, `[TRAFFIC] Generated packet batch #${count} - Sent to analyzer`]);
          if (count >= 5) {
            clearInterval(interval);
            setIsRunning(false);
            setLogs(prev => [...prev, `[DONE] Simulation complete.`]);
          }
        }, 1000);
      },
      onError: (err) => {
        setLogs(prev => [...prev, `[ERROR] Failed to start: ${err.message}`]);
        setIsRunning(false);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attack Simulation</h2>
        <p className="text-muted-foreground mt-2 font-mono text-sm">
          Generate synthetic network traffic to test IDS capabilities.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Attack Vector</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "normal", label: "Normal Traffic", icon: Activity },
                  { id: "ddos", label: "DDoS Attack", icon: Zap },
                  { id: "port_scan", label: "Port Scan", icon: Server },
                  { id: "brute_force", label: "Brute Force", icon: Square },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAttackType(type.id as AttackType)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-lg border transition-all hover:bg-accent/5",
                      attackType === type.id
                        ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_-5px_hsla(var(--primary),0.3)]"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <type.icon className="w-6 h-6" />
                    <span className="text-xs font-bold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Duration</label>
                <span className="font-mono text-primary">{duration}s</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="120" 
                step="10"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Intensity</label>
              <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
                {(["low", "medium", "high"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setIntensity(lvl)}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all",
                      intensity === lvl
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={isPending || isRunning}
              className={cn(
                "w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2",
                isRunning
                  ? "bg-muted cursor-not-allowed text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_-5px_hsla(var(--primary),0.5)]"
              )}
            >
              {isPending || isRunning ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  INITIALIZING...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  START SIMULATION
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col h-full">
           <Terminal logs={logs} className="h-full min-h-[400px]" />
        </div>
      </div>
    </div>
  );
}
