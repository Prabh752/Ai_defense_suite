import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";

import Dashboard from "@/pages/Dashboard";
import LiveTraffic from "@/pages/LiveTraffic";
import Simulation from "@/pages/Simulation";
import Models from "@/pages/Models";
import SystemHealth from "@/pages/SystemHealth";
import AISuggestions from "@/pages/AISuggestions";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Decorative Scanline Overlay */}
      <div className="scanline z-50 pointer-events-none" />
      
      <Sidebar />
      
      <main className="flex-1 h-full overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto pb-12">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/traffic" component={LiveTraffic} />
            <Route path="/simulation" component={Simulation} />
            <Route path="/models" component={Models} />
            <Route path="/system" component={SystemHealth} />
            <Route path="/ai-advisor" component={AISuggestions} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
