import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TerminalProps {
  logs: string[];
  className?: string;
  title?: string;
}

export function Terminal({ logs, className, title = "SYSTEM_OUTPUT" }: TerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className={cn(
      "bg-black border border-border rounded-lg overflow-hidden font-mono text-sm",
      className
    )}>
      <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground tracking-widest">{title}</span>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>
      </div>
      <div className="p-4 h-64 overflow-y-auto space-y-1">
        {logs.length === 0 ? (
          <span className="text-muted-foreground italic opacity-50">Waiting for input...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-2 text-green-500/90">
              <span className="text-muted-foreground select-none opacity-50">{">"}</span>
              <span className="break-all">{log}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
