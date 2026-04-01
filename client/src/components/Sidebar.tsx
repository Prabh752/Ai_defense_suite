import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Activity, ShieldAlert, Cpu, Network,
  Brain, Globe, Wifi, WifiOff, Loader2, Settings, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIDSStore } from "@/store";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, section: "monitor" },
  { href: "/traffic", label: "Live Traffic", icon: Network, section: "monitor" },
  { href: "/topology", label: "Topology Map", icon: Globe, section: "monitor" },
  { href: "/system", label: "System Health", icon: Activity, section: "monitor" },
  { href: "/simulation", label: "Attack Sim", icon: Target, section: "tools" },
  { href: "/models", label: "ML Models", icon: Cpu, section: "tools" },
  { href: "/ai-advisor", label: "AI Advisor", icon: Brain, section: "tools", badge: "AI" },
  { href: "/admin", label: "Deep Analysis", icon: Settings, section: "admin" },
];

function WsStatusDot() {
  const status = useIDSStore(s => s.wsStatus);
  return (
    <div className="flex items-center gap-1.5">
      {status === "connected" && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
      {status === "connecting" && <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />}
      {(status === "disconnected" || status === "error") && <div className="w-2 h-2 rounded-full bg-red-400" />}
      <span className={cn(
        "text-[10px] font-mono font-bold",
        status === "connected" ? "text-primary" : status === "connecting" ? "text-yellow-400" : "text-red-400"
      )}>
        {status === "connected" ? "LIVE" : status === "connecting" ? "SYNC" : "OFF"}
      </span>
    </div>
  );
}

const SECTION_LABELS: Record<string, string> = {
  monitor: "Monitor",
  tools: "Tools",
  admin: "Admin",
};

export function Sidebar() {
  const [location] = useLocation();
  const unreadCount = useIDSStore(s => s.unreadCount);

  const sections = Array.from(new Set(NAV_ITEMS.map(i => i.section)));

  return (
    <div className="w-64 h-screen border-r border-border bg-card flex flex-col shrink-0">
      {/* Brand */}
      <div className="p-5 border-b border-border/50">
        <h1 className="font-mono text-xl font-bold flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg border border-primary/20">
            <ShieldAlert className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <span className="text-primary">NIDS</span>
          <span className="text-foreground">_PRO</span>
        </h1>
        <div className="flex items-center justify-between mt-2.5">
          <WsStatusDot />
          <span className="text-[10px] font-mono text-muted-foreground/50">v2.5.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {sections.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section);
          return (
            <div key={section}>
              <div className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                {SECTION_LABELS[section]}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.97 }}
                        data-testid={`nav-${item.href.replace("/", "") || "home"}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 relative",
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/25 shadow-sm"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                        <span className="flex-1 truncate">{item.label}</span>

                        {"badge" in item && item.badge && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary/20 text-primary border border-primary/30 leading-none">
                            {item.badge}
                          </span>
                        )}

                        {item.href === "/" && unreadCount > 0 && (
                          <AnimatePresence>
                            <motion.span
                              key="badge"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold"
                            >
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </motion.span>
                          </AnimatePresence>
                        )}

                        {isActive && (
                          <div className="w-1 h-1 rounded-full bg-primary animate-pulse ml-auto" />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <div className="bg-muted/20 rounded-lg p-3 text-[10px] font-mono text-muted-foreground space-y-1.5">
          <div className="flex justify-between items-center">
            <span>WEBSOCKET</span>
            <WsStatusDot />
          </div>
          <div className="flex justify-between">
            <span>ENGINE</span>
            <span className="text-primary/70">RF+AE+LSTM</span>
          </div>
          <div className="flex justify-between opacity-50">
            <span>STACK</span>
            <span>React+WS+Zustand</span>
          </div>
        </div>
      </div>
    </div>
  );
}
