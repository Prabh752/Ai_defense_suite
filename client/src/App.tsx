import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { Toaster as Sonner } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useWebSocket } from "@/hooks/use-websocket";

import Dashboard from "@/pages/Dashboard";
import LiveTraffic from "@/pages/LiveTraffic";
import Simulation from "@/pages/Simulation";
import Models from "@/pages/Models";
import SystemHealth from "@/pages/SystemHealth";
import AISuggestions from "@/pages/AISuggestions";
import NetworkTopology from "@/pages/NetworkTopology";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.22, ease: "easeOut" },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...PAGE_TRANSITION}>
      {children}
    </motion.div>
  );
}

function WebSocketInit() {
  useWebSocket();
  return null;
}

function Router() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-8 pb-16">
          <AnimatePresence mode="wait">
            <Switch key={location}>
              <Route path="/">
                <PageWrapper><Dashboard /></PageWrapper>
              </Route>
              <Route path="/traffic">
                <PageWrapper><LiveTraffic /></PageWrapper>
              </Route>
              <Route path="/topology">
                <PageWrapper><NetworkTopology /></PageWrapper>
              </Route>
              <Route path="/simulation">
                <PageWrapper><Simulation /></PageWrapper>
              </Route>
              <Route path="/models">
                <PageWrapper><Models /></PageWrapper>
              </Route>
              <Route path="/system">
                <PageWrapper><SystemHealth /></PageWrapper>
              </Route>
              <Route path="/ai-advisor">
                <PageWrapper><AISuggestions /></PageWrapper>
              </Route>
              <Route path="/admin">
                <PageWrapper><Admin /></PageWrapper>
              </Route>
              <Route>
                <PageWrapper><NotFound /></PageWrapper>
              </Route>
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
          richColors
          toastOptions={{
            style: {
              background: "hsl(222 47% 8%)",
              border: "1px solid hsl(217 33% 17%)",
              color: "hsl(210 40% 98%)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "12px",
            },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
