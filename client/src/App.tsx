import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { Toaster as Sonner } from "sonner";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";

import Dashboard from "@/pages/Dashboard";
import LiveTraffic from "@/pages/LiveTraffic";
import Simulation from "@/pages/Simulation";
import Models from "@/pages/Models";
import SystemHealth from "@/pages/SystemHealth";
import AISuggestions from "@/pages/AISuggestions";
import NetworkTopology from "@/pages/NetworkTopology";
import NotFound from "@/pages/not-found";

function WebSocketInit() {
  useWebSocket();
  return null;
}

function Router() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className="scanline z-50 pointer-events-none" />
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto pb-12">
          <AnimatePresence mode="wait">
            <Switch key={location}>
              <Route path="/" component={Dashboard} />
              <Route path="/traffic" component={LiveTraffic} />
              <Route path="/topology" component={NetworkTopology} />
              <Route path="/simulation" component={Simulation} />
              <Route path="/models" component={Models} />
              <Route path="/system" component={SystemHealth} />
              <Route path="/ai-advisor" component={AISuggestions} />
              <Route component={NotFound} />
            </Switch>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WebSocketInit />
        <Router />
        <Toaster />
        <Sonner
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(222 47% 8%)",
              border: "1px solid hsl(217 33% 17%)",
              color: "hsl(210 40% 98%)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "13px",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
