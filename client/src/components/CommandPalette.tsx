import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutDashboard, Network, Globe, Activity, Target, Cpu, Brain, Settings, Map, ShieldAlert, BarChart3, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
  category: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const NAV_ITEMS: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", description: "Security Operations Center overview", icon: LayoutDashboard, color: "text-primary", category: "Navigate", shortcut: "Alt+1", action: () => { navigate("/"); onClose(); } },
    { id: "traffic", label: "Live Traffic", description: "Real-time packet stream & anomaly feed", icon: Network, color: "text-cyan-400", category: "Navigate", shortcut: "Alt+2", action: () => { navigate("/traffic"); onClose(); } },
    { id: "topology", label: "Network Topology", description: "Infrastructure map and attack paths", icon: Globe, color: "text-purple-400", category: "Navigate", shortcut: "Alt+3", action: () => { navigate("/topology"); onClose(); } },
    { id: "system", label: "System Health", description: "CPU, memory, and throughput monitoring", icon: Activity, color: "text-emerald-400", category: "Navigate", shortcut: "Alt+4", action: () => { navigate("/system"); onClose(); } },
    { id: "simulation", label: "Attack Simulator", description: "Inject synthetic adversarial traffic", icon: Target, color: "text-red-400", category: "Navigate", shortcut: "Alt+5", action: () => { navigate("/simulation"); onClose(); } },
    { id: "models", label: "ML Models", description: "Train and manage detection engines", icon: Cpu, color: "text-blue-400", category: "Navigate", shortcut: "Alt+6", action: () => { navigate("/models"); onClose(); } },
    { id: "ai", label: "AI Advisor", description: "SENTINEL-AI threat intelligence analysis", icon: Brain, color: "text-primary", category: "Navigate", shortcut: "Alt+7", action: () => { navigate("/ai-advisor"); onClose(); } },
    { id: "threat-map", label: "Threat Map", description: "Global attack origin visualization", icon: Map, color: "text-red-400", category: "Navigate", action: () => { navigate("/threat-map"); onClose(); } },
    { id: "rules", label: "Firewall Rules", description: "Intrusion prevention rule engine", icon: ShieldAlert, color: "text-yellow-400", category: "Navigate", action: () => { navigate("/rules"); onClose(); } },
    { id: "reports", label: "Reports Center", description: "Security reports & data exports", icon: BarChart3, color: "text-indigo-400", category: "Navigate", action: () => { navigate("/reports"); onClose(); } },
    { id: "admin", label: "Deep Analysis", description: "Administrative analytics dashboard", icon: Settings, color: "text-orange-400", category: "Navigate", shortcut: "Alt+8", action: () => { navigate("/admin"); onClose(); } },
  ];

  const filtered = query.trim()
    ? NAV_ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : NAV_ITEMS;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) { e.preventDefault(); filtered[selected].action(); }
  }, [open, filtered, selected, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const groups = Array.from(new Set(filtered.map(i => i.category)));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9000] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            className="fixed z-[9001] top-[20%] left-1/2 -translate-x-1/2 w-[580px] max-w-[95vw]"
            initial={{ opacity: 0, scale: 0.94, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div
              className="rounded-2xl border border-primary/30 overflow-hidden"
              style={{ background: "hsl(222 47% 5%)", boxShadow: "0 0 80px -20px hsl(var(--primary)/0.4), 0 25px 50px -12px rgba(0,0,0,0.8)" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
                <Search className="w-5 h-5 text-primary shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search pages, features, actions..."
                  className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                  data-testid="input-command-search"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/60 rounded text-muted-foreground">ESC</kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[380px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground font-mono text-sm">
                    No results for "{query}"
                  </div>
                ) : (
                  groups.map(group => (
                    <div key={group}>
                      <div className="px-5 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/50">
                        {group}
                      </div>
                      {filtered.filter(i => i.category === group).map(item => {
                        const globalIdx = filtered.indexOf(item);
                        const isSelected = globalIdx === selected;
                        return (
                          <motion.button
                            key={item.id}
                            onMouseEnter={() => setSelected(globalIdx)}
                            onClick={item.action}
                            data-testid={`cmd-${item.id}`}
                            className={cn(
                              "w-full flex items-center gap-4 px-5 py-3 text-left transition-colors",
                              isSelected ? "bg-primary/10" : "hover:bg-muted/20"
                            )}
                          >
                            <div className={cn("p-2 rounded-lg", isSelected ? "bg-primary/20" : "bg-muted/30")}>
                              <item.icon className={cn("w-4 h-4", item.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn("text-sm font-medium", isSelected ? "text-foreground" : "text-foreground/80")}>
                                {item.label}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                                {item.description}
                              </div>
                            </div>
                            {item.shortcut && (
                              <kbd className="px-2 py-0.5 text-[10px] font-mono bg-muted/40 border border-border/50 rounded text-muted-foreground whitespace-nowrap">
                                {item.shortcut}
                              </kbd>
                            )}
                            {isSelected && (
                              <div className="text-[10px] font-mono text-muted-foreground/50">↩</div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 text-[10px] font-mono text-muted-foreground/40">
                <div className="flex items-center gap-3">
                  <span>↑↓ navigate</span>
                  <span>↩ open</span>
                  <span>ESC close</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary/60">
                  <Zap className="w-3 h-3" />
                  NIDS_PRO Command Center
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
