import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  variant?: "default" | "danger" | "warning" | "success";
}

export function StatCard({ title, value, icon, trend, trendUp, className, variant = "default" }: StatCardProps) {
  const variants = {
    default: "border-border hover:border-primary/50",
    danger: "border-destructive/30 hover:border-destructive bg-destructive/5",
    warning: "border-yellow-500/30 hover:border-yellow-500 bg-yellow-500/5",
    success: "border-primary/30 hover:border-primary bg-primary/5",
  };

  return (
    <div className={cn(
      "p-6 rounded-xl border bg-card transition-all duration-300 hover:shadow-lg group",
      variants[variant],
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">{title}</p>
          <h3 className={cn(
            "text-2xl font-bold mt-2 font-mono tracking-tight",
            variant === "danger" ? "text-destructive text-glow-red" : "text-foreground"
          )}>
            {value}
          </h3>
        </div>
        <div className={cn(
          "p-3 rounded-lg bg-background/50 border border-white/5",
          variant === "danger" ? "text-destructive" : "text-primary"
        )}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2 text-xs font-medium">
          <span className={cn(
            trendUp ? "text-emerald-500" : "text-destructive",
            "flex items-center"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
          <span className="text-muted-foreground">vs last hour</span>
        </div>
      )}
    </div>
  );
}
