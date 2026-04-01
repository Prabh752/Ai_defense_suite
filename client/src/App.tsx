import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { Toaster as Sonner } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useWebSocket } from "@/hooks/use-websocket";
import { useState, useEffect, useRef } from "react";

import { PageSplash } from "@/components/PageSplash";
import { CommandPalette } from "@/components/CommandPalette";
import { TopBar } from "@/components/TopBar";

import Dashboard from "@/pages/Dashboard";
import LiveTraffic from "@/pages/LiveTraffic";
import Simulation from "@/pages/Simulation";
import Models from "@/pages/Models";
import SystemHealth from "@/pages/SystemHealth";
import AISuggestions from "@/pages/AISuggestions";
import NetworkTopology from "@/pages/NetworkTopology";
import Admin from "@/pages/Admin";
import ThreatMap from "@/pages/ThreatMap";
import FirewallRules from "@/pages/FirewallRules";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";

function WebSocketInit() {
  useWebSocket();
  return null;
}

function Router() {
  const [location, navigate] = useLocation();
  const [splashVisible, setSplashVisible] = useState(false);
  const [splashPath, setSplashPath] = useState("/");
  const [cmdOpen, setCmdOpen] = useState(false);
  const prevLocation = useRef(location);
  const splashTimer = useRef<ReturnType<typeof setTimeout>>();

  // Show splash on every route change (except first load)
  useEffect(() => {
    if (prevLocation.current !== location) {
      prevLocation.current = location;
      clearTimeout(splashTimer.current);
      setSplashPath(location);
      setSplashVisible(true);
      splashTimer.current = setTimeout(() => {
        setSplashVisible(false);
      }, 1600);
    }
  }, [location]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K → Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(o => !o);
        return;
      }
      // Escape → close palette
      if (e.key === "Escape") {
        setCmdOpen(false);
        return;
      }
      // Alt+1..8 shortcuts (skip if focus is in input)
      if (e.altKey && !e.target?.toString().includes("HTMLInputElement") && !e.target?.toString().includes("HTMLTextAreaElement")) {
        const shortcuts: Record<string, string> = {
          "1": "/", "2": "/traffic", "3": "/topology", "4": "/system",
          "5": "/simulation", "6": "/models", "7": "/ai-advisor", "8": "/admin",
        };
        if (shortcuts[e.key]) {
          e.preventDefault();
          navigate(shortcuts[e.key]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <>
      <PageSplash visible={splashVisible} pagePath={splashPath} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <TopBar currentPath={location} onOpenCommandPalette={() => setCmdOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto p-6 pb-16">
              <AnimatePresence mode="wait">
                <Switch key={location}>
                  <Route path="/">
                    <motion.div key="/" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Dashboard />
                    </motion.div>
                  </Route>
                  <Route path="/traffic">
                    <motion.div key="/traffic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <LiveTraffic />
                    </motion.div>
                  </Route>
                  <Route path="/topology">
                    <motion.div key="/topology" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <NetworkTopology />
                    </motion.div>
                  </Route>
                  <Route path="/simulation">
                    <motion.div key="/simulation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Simulation />
                    </motion.div>
                  </Route>
                  <Route path="/models">
                    <motion.div key="/models" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Models />
                    </motion.div>
                  </Route>
                  <Route path="/system">
                    <motion.div key="/system" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <SystemHealth />
                    </motion.div>
                  </Route>
                  <Route path="/ai-advisor">
                    <motion.div key="/ai-advisor" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <AISuggestions />
                    </motion.div>
                  </Route>
                  <Route path="/admin">
                    <motion.div key="/admin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Admin />
                    </motion.div>
                  </Route>
                  <Route path="/threat-map">
                    <motion.div key="/threat-map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <ThreatMap />
                    </motion.div>
                  </Route>
                  <Route path="/rules">
                    <motion.div key="/rules" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <FirewallRules />
                    </motion.div>
                  </Route>
                  <Route path="/reports">
                    <motion.div key="/reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Reports />
                    </motion.div>
                  </Route>
                  <Route>
                    <motion.div key="404" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <NotFound />
                    </motion.div>
                  </Route>
                </Switch>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </>
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
