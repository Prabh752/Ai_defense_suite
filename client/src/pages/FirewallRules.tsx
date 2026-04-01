import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Trash2, CheckCircle, XCircle, AlertTriangle, Filter, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIDSStore } from "@/store";

type RuleAction = "BLOCK" | "ALLOW" | "ALERT";
type Protocol = "TCP" | "UDP" | "ICMP" | "ANY";

interface FirewallRule {
  id: string;
  priority: number;
  name: string;
  sourceIp: string;
  destPort: string;
  protocol: Protocol;
  action: RuleAction;
  enabled: boolean;
  hits: number;
  description: string;
}

const DEFAULT_RULES: FirewallRule[] = [
  { id: "r1", priority: 1, name: "Block Known Attacker IPs", sourceIp: "45.33.22.0/24", destPort: "ANY", protocol: "ANY", action: "BLOCK", enabled: true, hits: 847, description: "Block entire CIDR range of known malicious actors" },
  { id: "r2", priority: 2, name: "Block Port Scan Traffic", sourceIp: "ANY", destPort: "1-1024", protocol: "TCP", action: "ALERT", enabled: true, hits: 312, description: "Alert on sequential low-port connections (SYN scan pattern)" },
  { id: "r3", priority: 3, name: "Rate Limit DDoS Threshold", sourceIp: "ANY", destPort: "80,443", protocol: "TCP", action: "BLOCK", enabled: true, hits: 1204, description: "Block IPs exceeding 1000 req/min to HTTP endpoints" },
  { id: "r4", priority: 4, name: "Allow Internal Network", sourceIp: "10.0.0.0/8", destPort: "ANY", protocol: "ANY", action: "ALLOW", enabled: true, hits: 52440, description: "Permit all traffic from trusted internal subnet" },
  { id: "r5", priority: 5, name: "Block Brute Force SSH", sourceIp: "ANY", destPort: "22", protocol: "TCP", action: "BLOCK", enabled: true, hits: 433, description: "Block IPs with >5 failed SSH auth attempts" },
  { id: "r6", priority: 6, name: "Block Tor Exit Nodes", sourceIp: "195.176.3.0/24", destPort: "ANY", protocol: "ANY", action: "BLOCK", enabled: false, hits: 28, description: "Block known Tor exit node CIDR ranges" },
];

const ACTION_CONFIG: Record<RuleAction, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  BLOCK: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25", icon: XCircle },
  ALLOW: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", icon: CheckCircle },
  ALERT: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/25", icon: AlertTriangle },
};

export default function FirewallRules() {
  const [rules, setRules] = useState<FirewallRule[]>(DEFAULT_RULES);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({ name: "", sourceIp: "ANY", destPort: "ANY", protocol: "ANY" as Protocol, action: "BLOCK" as RuleAction, description: "" });
  const alerts = useIDSStore(s => s.alerts);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const rule = rules.find(r => r.id === id);
    toast.success(`Rule "${rule?.name}" ${rule?.enabled ? "disabled" : "enabled"}`);
  };

  const deleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success(`Rule "${rule?.name}" deleted`);
  };

  const addRule = () => {
    if (!newRule.name) { toast.error("Rule name is required"); return; }
    const rule: FirewallRule = {
      id: `r${Date.now()}`,
      priority: rules.length + 1,
      ...newRule,
      enabled: true,
      hits: 0,
    };
    setRules(prev => [...prev, rule]);
    setShowAdd(false);
    setNewRule({ name: "", sourceIp: "ANY", destPort: "ANY", protocol: "ANY", action: "BLOCK", description: "" });
    toast.success(`Rule "${rule.name}" added`);
  };

  // Auto-suggest rules from live alerts
  const autoSuggestIps = Array.from(new Set(alerts.filter(a => a.severity === "high").map(a => a.sourceIp))).slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <Shield className="w-7 h-7 text-yellow-400" />
            </div>
            Firewall Rule Engine
          </h2>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Intrusion prevention rules — configure, prioritize, and manage network access controls.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 rounded-xl text-sm font-mono text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Rules", value: rules.length, color: "text-foreground" },
          { label: "Active", value: rules.filter(r => r.enabled).length, color: "text-primary" },
          { label: "Block Rules", value: rules.filter(r => r.action === "BLOCK" && r.enabled).length, color: "text-red-400" },
          { label: "Total Hits", value: rules.reduce((s, r) => s + r.hits, 0).toLocaleString(), color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={cn("text-2xl font-bold font-mono", s.color)}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-1 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI-Suggested rules from live threats */}
      {autoSuggestIps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider">AI Recommends — Auto-Block These Active Threats</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {autoSuggestIps.map(ip => (
              <button
                key={ip}
                onClick={() => {
                  const rule: FirewallRule = {
                    id: `auto-${Date.now()}`,
                    priority: rules.length + 1,
                    name: `Auto-Block ${ip}`,
                    sourceIp: ip,
                    destPort: "ANY",
                    protocol: "ANY",
                    action: "BLOCK",
                    enabled: true,
                    hits: 0,
                    description: `Auto-generated block rule from live threat detection`,
                  };
                  setRules(prev => [...prev, rule]);
                  toast.success(`Added block rule for ${ip}`);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/25 rounded-lg text-xs font-mono text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Block {ip}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Add Rule Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-primary/25 rounded-xl p-6 space-y-4">
              <div className="text-sm font-bold font-mono text-primary">Add New Rule</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">Rule Name *</label>
                  <input
                    value={newRule.name}
                    onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Block Malicious CIDR"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">Source IP / CIDR</label>
                  <input
                    value={newRule.sourceIp}
                    onChange={e => setNewRule(p => ({ ...p, sourceIp: e.target.value }))}
                    placeholder="e.g. 192.168.1.0/24 or ANY"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">Destination Port</label>
                  <input
                    value={newRule.destPort}
                    onChange={e => setNewRule(p => ({ ...p, destPort: e.target.value }))}
                    placeholder="e.g. 22, 80-443, ANY"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">Action</label>
                  <div className="flex gap-2">
                    {(["BLOCK", "ALLOW", "ALERT"] as RuleAction[]).map(a => (
                      <button
                        key={a}
                        onClick={() => setNewRule(p => ({ ...p, action: a }))}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-xs font-bold font-mono transition-all",
                          newRule.action === a
                            ? `${ACTION_CONFIG[a].bg} ${ACTION_CONFIG[a].border} ${ACTION_CONFIG[a].color}`
                            : "border-border text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addRule}
                  className="px-5 py-2 bg-primary/10 border border-primary/30 rounded-xl text-sm font-mono text-primary hover:bg-primary/20 transition-colors"
                >
                  Add Rule
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-2 border border-border rounded-xl text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            {rules.length} Rules · Evaluated in priority order
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/50 bg-muted/10">
                {["#", "Rule Name", "Source", "Port", "Proto", "Action", "Hits", "Status", ""].map(h => (
                  <th key={h} className="text-left py-3 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => {
                const actionCfg = ACTION_CONFIG[rule.action];
                const ActionIcon = actionCfg.icon;
                return (
                  <motion.tr
                    key={rule.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={cn("border-b border-border/20 hover:bg-muted/10 transition-colors group", !rule.enabled && "opacity-40")}
                  >
                    <td className="py-3 px-4 text-muted-foreground">{rule.priority}</td>
                    <td className="py-3 px-4">
                      <div className="text-foreground font-medium">{rule.name}</div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{rule.description}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{rule.sourceIp}</td>
                    <td className="py-3 px-4 text-muted-foreground">{rule.destPort}</td>
                    <td className="py-3 px-4 text-muted-foreground">{rule.protocol}</td>
                    <td className="py-3 px-4">
                      <span className={cn("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border w-fit", actionCfg.bg, actionCfg.border, actionCfg.color)}>
                        <ActionIcon className="w-3 h-3" />
                        {rule.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{rule.hits.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={cn(
                          "w-10 h-5 rounded-full border transition-all relative",
                          rule.enabled ? "bg-primary border-primary" : "bg-muted border-border"
                        )}
                      >
                        <div className={cn("w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all", rule.enabled ? "left-5" : "left-0.5")} />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
