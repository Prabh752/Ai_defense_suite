import { Link, useLocation } from "wouter";
import { LayoutDashboard, Activity, ShieldAlert, Cpu, Network, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/traffic", label: "Live Traffic", icon: Network },
  { href: "/simulation", label: "Attack Sim", icon: ShieldAlert },
  { href: "/models", label: "ML Models", icon: Cpu },
  { href: "/system", label: "System Health", icon: Activity },
  { href: "/ai-advisor", label: "AI Advisor", icon: Brain, badge: "AI" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 h-screen border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border/50">
        <h1 className="font-mono text-xl font-bold text-primary tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
          NIDS<span className="text-foreground">_PRO</span>
        </h1>
        <div className="text-xs text-muted-foreground mt-1 font-mono">
          System Status: <span className="text-primary animate-pulse">ONLINE</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary/10 text-primary border-l-2 border-primary shadow-[0_0_10px_-2px_hsla(var(--primary),0.3)]" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                {item.label}
                {"badge" in item && item.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/20 text-primary border border-primary/30 leading-none">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono text-muted-foreground">
          <div className="flex justify-between mb-1">
            <span>UPTIME</span>
            <span>24:12:05</span>
          </div>
          <div className="flex justify-between">
            <span>VERSION</span>
            <span>v2.4.0-RC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
