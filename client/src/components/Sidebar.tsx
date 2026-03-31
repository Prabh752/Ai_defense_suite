import { Link, useLocation } from "wouter";
import { LayoutDashboard, Activity, ShieldAlert, Cpu, Network, Brain, Globe, Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIDSStore } from "@/store";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/traffic", label: "Live Traffic", icon: Network },
  { href: "/topology", label: "Topology", icon: Globe },
  { href: "/simulation", label: "Attack Sim", icon: ShieldAlert },
  { href: "/models", label: "ML Models", icon: Cpu },
  { href: "/system", label: "System Health", icon: Activity },
  { href: "/ai-advisor", label: "AI Advisor", icon: Brain, badge: "AI" },
];

function WsIndicator() {
  const status = useIDSStore((s) => s.wsStatus);
  return (
    <div className="flex items-center gap-1.5">
      {status === "connected" && <Wifi className="w-3 h-3 text-primary" />}
      {status === "disconnected" || status === "error" ? <WifiOff className="w-3 h-3 text-destructive" /> : null}
      {status === "connecting" && <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />}
      <span className={cn(
        "text-[10px] font-mono font-bold uppercase",
        status === "connected" ? "text-primary" :
        status === "connecting" ? "text-yellow-400" :
        "text-destructive"
      )}>
        {status === "connected" ? "LIVE" : status === "connecting" ? "SYNC..." : "OFFLINE"}
      </span>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const unreadCount = useIDSStore((s) => s.unreadCount);

  return (
    <div className="w-64 h-screen border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-6 border-b border-border/50">
        <h1 className="font-mono text-xl font-bold text-primary tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
          NIDS<span className="text-foreground">_PRO</span>
        </h1>
        <div className="text-xs text-muted-foreground mt-1.5 flex items-center justify-between">
          <WsIndicator />
          <span className="font-mono opacity-60">v2.5.0</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer relative",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary shadow-[0_0_12px_-3px_hsla(var(--primary),0.3)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
                <span className="flex-1">{item.label}</span>

                {"badge" in item && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/20 text-primary border border-primary/30 leading-none">
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
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </motion.span>
                  </AnimatePresence>
                )}

                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono text-muted-foreground space-y-1.5">
          <div className="flex justify-between">
            <span>WEBSOCKET</span>
            <WsIndicator />
          </div>
          <div className="flex justify-between">
            <span>TECH STACK</span>
            <span className="text-primary/70">React+WS+ZST</span>
          </div>
          <div className="flex justify-between opacity-60">
            <span>VERSION</span>
            <span>v2.5.0-RC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
