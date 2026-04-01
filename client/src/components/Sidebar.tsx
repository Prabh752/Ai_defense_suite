import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Activity, ShieldAlert, Cpu, Network,
  Brain, Globe, Wifi, WifiOff, Loader2, Settings, Target,
  Map, Shield, BarChart3, ChevronDown, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIDSStore } from "@/store";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const NAV_SECTIONS = [
  {
    id: "monitor",
    label: "Monitor",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/traffic", label: "Live Traffic", icon: Network },
      { href: "/topology", label: "Topology Map", icon: Globe },
      { href: "/threat-map", label: "Threat Map", icon: Map, badge: "NEW", badgeColor: "bg-red-500/20 text-red-400 border-red-500/30" },
      { href: "/system", label: "System Health", icon: Activity },
    ] as NavItem[],
  },
  {
    id: "defense",
    label: "Defense",
    items: [
      { href: "/simulation", label: "Attack Sim", icon: Target },
      { href: "/rules", label: "Firewall Rules", icon: Shield },
      { href: "/models", label: "ML Models", icon: Cpu },
    ] as NavItem[],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { href: "/ai-advisor", label: "AI Advisor", icon: Brain, badge: "AI", badgeColor: "bg-primary/20 text-primary border-primary/30" },
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin", label: "Deep Analysis", icon: Settings },
    ] as NavItem[],
  },
];

function WsStatusBadge() {
  const status = useIDSStore(s => s.wsStatus);
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-mono font-bold",
      status === "connected" ? "bg-primary/10 border-primary/25 text-primary" :
      status === "connecting" ? "bg-yellow-500/10 border-yellow-500/25 text-yellow-400" :
      "bg-red-500/10 border-red-500/25 text-red-400"
    )}>
      {status === "connected" ? <><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />LIVE</> :
       status === "connecting" ? <><Loader2 className="w-3 h-3 animate-spin" />SYNC</> :
       <><WifiOff className="w-3 h-3" />OFF</>}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const unreadCount = useIDSStore(s => s.unreadCount);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  return (
    <div className="w-60 h-screen border-r border-border bg-card flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-border/40">
        <h1 className="font-mono text-lg font-bold flex items-center gap-2">
          <div className="relative p-1.5 bg-primary/10 rounded-lg border border-primary/20">
            <ShieldAlert className="w-4.5 h-4.5 text-primary" style={{ width: 18, height: 18 }} />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-ping" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
          </div>
          <span><span className="text-primary">NIDS</span><span className="text-foreground">_PRO</span></span>
        </h1>
        <div className="flex items-center justify-between mt-2.5">
          <WsStatusBadge />
          <span className="text-[9px] font-mono text-muted-foreground/40">v3.0.0</span>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="px-4 py-2 border-b border-border/30 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40">
        <kbd className="px-1.5 py-0.5 bg-muted/40 border border-border/50 rounded text-[9px]">⌘K</kbd>
        <span>Command Palette</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
        {NAV_SECTIONS.map(section => {
          const isCollapsed = collapsed[section.id];
          return (
            <div key={section.id} className="mb-1">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-3 py-1.5 mb-1 group"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors">
                  {section.label}
                </span>
                {isCollapsed
                  ? <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                  : <ChevronDown className="w-3 h-3 text-muted-foreground/30" />
                }
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-0.5"
                  >
                    {section.items.map((item) => {
                      const isActive = location === item.href;
                      return (
                        <Link key={item.href} href={item.href}>
                          <motion.div
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.97 }}
                            data-testid={`nav-${item.href.replace(/\//g, "") || "home"}`}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 text-sm",
                              isActive
                                ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                            )}
                          >
                            <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                            <span className="flex-1 truncate font-medium text-sm">{item.label}</span>

                            {item.badge && (
                              <span className={cn("px-1.5 py-0.5 text-[9px] font-bold rounded border leading-none", item.badgeColor)}>
                                {item.badge}
                              </span>
                            )}

                            {item.href === "/" && unreadCount > 0 && (
                              <AnimatePresence>
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="w-4.5 h-4.5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold"
                                  style={{ width: 18, height: 18 }}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-3 border-t border-border/40 pt-3">
        <div className="bg-muted/20 rounded-xl p-3 text-[10px] font-mono text-muted-foreground/50 space-y-1.5">
          <div className="flex justify-between">
            <span>ENGINE</span>
            <span className="text-primary/60">RF · AE · LSTM</span>
          </div>
          <div className="flex justify-between">
            <span>STACK</span>
            <span>React·WS·Zustand</span>
          </div>
          <div className="flex justify-between">
            <span>AI</span>
            <span className="text-primary/60">GPT-5.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
