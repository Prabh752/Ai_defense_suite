import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Network, Globe, Activity, Target, Cpu,
  Brain, Settings, Map, ShieldAlert, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageMeta {
  path: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  accent: string;
}

export const PAGE_META: PageMeta[] = [
  {
    path: "/",
    label: "Dashboard",
    description: "Security Operations Center",
    icon: LayoutDashboard,
    color: "text-primary",
    glow: "shadow-[0_0_60px_-10px_hsl(var(--primary)/0.8)]",
    accent: "border-primary/40 bg-primary/10",
  },
  {
    path: "/traffic",
    label: "Live Traffic",
    description: "Real-Time Packet Stream Analysis",
    icon: Network,
    color: "text-cyan-400",
    glow: "shadow-[0_0_60px_-10px_rgba(34,211,238,0.8)]",
    accent: "border-cyan-400/40 bg-cyan-400/10",
  },
  {
    path: "/topology",
    label: "Network Topology",
    description: "Infrastructure Map & Attack Paths",
    icon: Globe,
    color: "text-purple-400",
    glow: "shadow-[0_0_60px_-10px_rgba(167,139,250,0.8)]",
    accent: "border-purple-400/40 bg-purple-400/10",
  },
  {
    path: "/system",
    label: "System Health",
    description: "Resource Monitoring & Diagnostics",
    icon: Activity,
    color: "text-emerald-400",
    glow: "shadow-[0_0_60px_-10px_rgba(52,211,153,0.8)]",
    accent: "border-emerald-400/40 bg-emerald-400/10",
  },
  {
    path: "/simulation",
    label: "Attack Simulator",
    description: "Adversarial Traffic Injection Engine",
    icon: Target,
    color: "text-red-400",
    glow: "shadow-[0_0_60px_-10px_rgba(248,113,113,0.8)]",
    accent: "border-red-400/40 bg-red-400/10",
  },
  {
    path: "/models",
    label: "ML Detection Models",
    description: "Neural Network Management Console",
    icon: Cpu,
    color: "text-blue-400",
    glow: "shadow-[0_0_60px_-10px_rgba(96,165,250,0.8)]",
    accent: "border-blue-400/40 bg-blue-400/10",
  },
  {
    path: "/ai-advisor",
    label: "SENTINEL-AI",
    description: "Autonomous Security Intelligence Advisor",
    icon: Brain,
    color: "text-primary",
    glow: "shadow-[0_0_60px_-10px_hsl(var(--primary)/0.8)]",
    accent: "border-primary/40 bg-primary/10",
  },
  {
    path: "/admin",
    label: "Deep Analysis",
    description: "Administrative Analytics & Controls",
    icon: Settings,
    color: "text-orange-400",
    glow: "shadow-[0_0_60px_-10px_rgba(251,146,60,0.8)]",
    accent: "border-orange-400/40 bg-orange-400/10",
  },
  {
    path: "/threat-map",
    label: "Threat Intelligence Map",
    description: "Global Attack Origin Visualization",
    icon: Map,
    color: "text-red-400",
    glow: "shadow-[0_0_60px_-10px_rgba(248,113,113,0.8)]",
    accent: "border-red-400/40 bg-red-400/10",
  },
  {
    path: "/rules",
    label: "Firewall Rules",
    description: "Intrusion Prevention Rule Engine",
    icon: ShieldAlert,
    color: "text-yellow-400",
    glow: "shadow-[0_0_60px_-10px_rgba(250,204,21,0.8)]",
    accent: "border-yellow-400/40 bg-yellow-400/10",
  },
  {
    path: "/reports",
    label: "Reports Center",
    description: "Security Incident Reports & Exports",
    icon: BarChart3,
    color: "text-indigo-400",
    glow: "shadow-[0_0_60px_-10px_rgba(129,140,248,0.8)]",
    accent: "border-indigo-400/40 bg-indigo-400/10",
  },
];

export function getPageMeta(path: string): PageMeta {
  return PAGE_META.find(p => p.path === path) ?? {
    path,
    label: "NIDS_PRO",
    description: "Network Intrusion Detection System",
    icon: ShieldAlert,
    color: "text-primary",
    glow: "shadow-[0_0_60px_-10px_hsl(var(--primary)/0.8)]",
    accent: "border-primary/40 bg-primary/10",
  };
}

interface PageSplashProps {
  visible: boolean;
  pagePath: string;
}

export function PageSplash({ visible, pagePath }: PageSplashProps) {
  const meta = getPageMeta(pagePath);
  const Icon = meta.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: "rgba(6,10,20,0.96)", backdropFilter: "blur(12px)" }}
        >
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(hsl(var(--primary)/0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.3) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          {/* Scan line sweep */}
          <motion.div
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-60"
            initial={{ top: "-2px" }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 1.0, ease: "linear" }}
          />

          {/* Corner decorations */}
          {[
            "top-8 left-8 border-t-2 border-l-2",
            "top-8 right-8 border-t-2 border-r-2",
            "bottom-8 left-8 border-b-2 border-l-2",
            "bottom-8 right-8 border-b-2 border-r-2",
          ].map((cls, i) => (
            <motion.div
              key={i}
              className={cn("absolute w-12 h-12", cls, meta.color.replace("text-", "border-"))}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            />
          ))}

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-8 text-center">
            {/* Icon container */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
              className={cn(
                "p-7 rounded-3xl border-2",
                meta.accent,
                meta.glow
              )}
            >
              <Icon className={cn("w-16 h-16", meta.color)} strokeWidth={1.5} />
            </motion.div>

            {/* System prefix */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="font-mono text-xs tracking-[0.5em] text-muted-foreground uppercase"
              >
                NIDS_PRO :: LOADING MODULE
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className={cn("text-5xl font-bold tracking-tight font-mono", meta.color)}
                style={{ textShadow: "0 0 40px currentColor" }}
              >
                {meta.label}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="text-muted-foreground font-mono text-sm tracking-wider"
              >
                {meta.description}
              </motion.p>
            </div>

            {/* Progress bar */}
            <motion.div
              className="w-72 h-0.5 bg-muted/30 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className={cn("h-full rounded-full", meta.color.replace("text-", "bg-"))}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.9, delay: 0.35, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Status text */}
            <motion.div
              className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Initializing secure context...
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
