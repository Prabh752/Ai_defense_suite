
import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "./db";
import * as schema from "@shared/schema";
import { desc, sql, gte, and } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// === WebSocket Broadcast Utility ===
let wss: WebSocketServer;

export function broadcast(payload: object) {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === WebSocket Server Setup ===
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "connected", clientCount: wss.clients.size }));
    ws.on("error", () => {});
    ws.on("close", () => {});
  });

  // === Traffic Endpoints ===
  app.get(api.traffic.list.path, async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const type = req.query.type as string | undefined;
    const logs = await storage.getTrafficLogs(limit, type);
    res.json(logs);
  });

  app.get(api.traffic.stats.path, async (req, res) => {
    const stats = await storage.getTrafficStats();
    const throughput = Math.floor(Math.random() * 1000) + 500;
    res.json({ ...stats, throughput });
  });

  app.post(api.traffic.log.path, async (req, res) => {
    try {
      const input = api.traffic.log.input.parse(req.body);
      const log = await storage.createTrafficLog(input);
      broadcast({ type: "traffic_event", data: log });
      if (log.isAnomaly) {
        broadcast({
          type: "alert",
          data: {
            id: String(log.id),
            attackType: log.attackType || "Unknown",
            sourceIp: log.sourceIp,
            severity: (log.confidenceScore || 0) > 0.85 ? "high" : (log.confidenceScore || 0) > 0.5 ? "medium" : "low",
          },
        });
      }
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // === ML Model Endpoints ===
  app.get(api.models.list.path, async (req, res) => {
    const models = await storage.getMlModels();
    res.json(models);
  });

  app.post(api.models.train.path, async (req, res) => {
    const id = Number(req.params.id);
    const model = await storage.getMlModel(id);
    if (!model) return res.status(404).json({ message: "Model not found" });

    await storage.updateMlModelStatus(id, "training");
    broadcast({ type: "model_status", data: { id, status: "training" } });

    setTimeout(async () => {
      const updated = await storage.updateMlModelStatus(id, "active");
      broadcast({ type: "model_status", data: { id, status: "active", accuracy: updated.accuracy } });
    }, 5000);

    res.json({ status: "success", message: `Training started for ${model.name}` });
  });

  // === Simulation Endpoints ===
  app.post(api.simulation.start.path, async (req, res) => {
    const input = api.simulation.start.input.parse(req.body);
    const jobId = randomBytes(4).toString("hex");

    let elapsed = 0;
    const interval = setInterval(async () => {
      if (elapsed >= input.durationSeconds) {
        clearInterval(interval);
        broadcast({ type: "simulation_complete", data: { jobId, attackType: input.attackType } });
        return;
      }

      const isAttack = input.attackType !== "normal";
      const attackIps = ["45.33.22.11", "192.168.1.200", "10.10.10.55", "172.16.0.100", "203.0.113.42"];
      const log = await storage.createTrafficLog({
        sourceIp: isAttack ? attackIps[Math.floor(Math.random() * attackIps.length)] : "10.0.0.5",
        destinationIp: "10.0.0.1",
        protocol: Math.random() > 0.5 ? "TCP" : "UDP",
        length: Math.floor(Math.random() * 1500),
        info: isAttack ? `Suspicious payload detected: ${input.attackType}` : "Normal traffic",
        isAnomaly: isAttack,
        attackType: isAttack ? input.attackType : "Normal",
        confidenceScore: isAttack ? 0.8 + Math.random() * 0.2 : 0.05 + Math.random() * 0.1,
      });

      broadcast({ type: "traffic_event", data: log });
      if (log.isAnomaly) {
        broadcast({
          type: "alert",
          data: {
            id: String(log.id),
            attackType: log.attackType || "Unknown",
            sourceIp: log.sourceIp,
            severity: (log.confidenceScore || 0) > 0.85 ? "high" : "medium",
          },
        });
      }
      elapsed++;
    }, 1000);

    res.json({ message: "Simulation started", jobId });
  });

  // === System Stats Endpoints ===
  app.get(api.system.stats.path, async (req, res) => {
    const stats = await storage.getSystemStats();
    res.json(stats);
  });

  // === Admin Analytics Endpoints ===
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const [trafficStats, recentLogs, models, systemStats] = await Promise.all([
        storage.getTrafficStats(),
        storage.getTrafficLogs(500),
        storage.getMlModels(),
        storage.getSystemStats(60),
      ]);

      // Top attacker IPs
      const ipMap: Record<string, { count: number; anomalyCount: number; lastSeen: Date }> = {};
      for (const log of recentLogs) {
        if (!ipMap[log.sourceIp]) ipMap[log.sourceIp] = { count: 0, anomalyCount: 0, lastSeen: new Date(log.timestamp!) };
        ipMap[log.sourceIp].count++;
        if (log.isAnomaly) ipMap[log.sourceIp].anomalyCount++;
        const ts = new Date(log.timestamp!);
        if (ts > ipMap[log.sourceIp].lastSeen) ipMap[log.sourceIp].lastSeen = ts;
      }
      const topAttackers = Object.entries(ipMap)
        .filter(([, v]) => v.anomalyCount > 0)
        .sort((a, b) => b[1].anomalyCount - a[1].anomalyCount)
        .slice(0, 10)
        .map(([ip, v]) => ({ ip, ...v, threatScore: Math.min(100, Math.round((v.anomalyCount / v.count) * 100)) }));

      // Protocol distribution
      const protoMap: Record<string, number> = {};
      for (const log of recentLogs) {
        protoMap[log.protocol] = (protoMap[log.protocol] || 0) + 1;
      }

      // Hourly distribution (last 24h)
      const now = Date.now();
      const hourlyBuckets: Record<number, { normal: number; anomaly: number }> = {};
      for (let h = 23; h >= 0; h--) {
        hourlyBuckets[h] = { normal: 0, anomaly: 0 };
      }
      for (const log of recentLogs) {
        const hoursAgo = Math.floor((now - new Date(log.timestamp!).getTime()) / (1000 * 60 * 60));
        if (hoursAgo < 24) {
          const bucket = hourlyBuckets[hoursAgo] || { normal: 0, anomaly: 0 };
          if (log.isAnomaly) bucket.anomaly++;
          else bucket.normal++;
          hourlyBuckets[hoursAgo] = bucket;
        }
      }
      const hourlyData = Object.entries(hourlyBuckets)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([h, v]) => ({ hour: `${h}h ago`, ...v }));

      // Detection accuracy per attack type
      const attackAccuracy = Object.entries(trafficStats.attackTypesDistribution).map(([type, count]) => ({
        type,
        count,
        detectionRate: type === "Normal" ? 0 : 92 + Math.random() * 7,
      }));

      // Avg system stats
      const avgCpu = systemStats.reduce((s, r) => s + (r.cpuUsage || 0), 0) / Math.max(systemStats.length, 1);
      const avgMem = systemStats.reduce((s, r) => s + (r.memoryUsage || 0), 0) / Math.max(systemStats.length, 1);
      const avgThroughput = systemStats.reduce((s, r) => s + (r.networkThroughput || 0), 0) / Math.max(systemStats.length, 1);

      res.json({
        trafficStats,
        topAttackers,
        protocolDistribution: protoMap,
        hourlyData,
        attackAccuracy,
        modelStats: models,
        systemAvg: { cpu: avgCpu, memory: avgMem, throughput: avgThroughput },
        totalLogs: recentLogs.length,
      });
    } catch (err) {
      res.status(500).json({ message: "Analytics failed" });
    }
  });

  app.delete("/api/admin/logs", async (req, res) => {
    try {
      await db.delete(schema.trafficLogs);
      broadcast({ type: "logs_cleared" });
      res.json({ message: "All traffic logs cleared" });
    } catch (err) {
      res.status(500).json({ message: "Failed to clear logs" });
    }
  });

  app.get("/api/admin/export", async (req, res) => {
    try {
      const logs = await storage.getTrafficLogs(1000);
      const csv = [
        "id,timestamp,sourceIp,destinationIp,protocol,length,info,isAnomaly,attackType,confidenceScore",
        ...logs.map(l => [
          l.id,
          l.timestamp,
          l.sourceIp,
          l.destinationIp,
          l.protocol,
          l.length,
          `"${(l.info || "").replace(/"/g, '""')}"`,
          l.isAnomaly,
          l.attackType,
          l.confidenceScore,
        ].join(","))
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=nids_logs.csv");
      res.send(csv);
    } catch (err) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  // === AI Suggestions Endpoint ===
  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const { question } = req.body;

      const [trafficStats, recentLogs, models, systemStatsList] = await Promise.all([
        storage.getTrafficStats(),
        storage.getTrafficLogs(30),
        storage.getMlModels(),
        storage.getSystemStats(10),
      ]);

      const latestStats = systemStatsList[0];
      const anomalyLogs = recentLogs.filter(l => l.isAnomaly).slice(0, 10);
      const attackDist = trafficStats.attackTypesDistribution;
      const threatRate = trafficStats.totalPackets > 0 
        ? ((trafficStats.anomaliesDetected / trafficStats.totalPackets) * 100).toFixed(2) 
        : "0";
      const riskLevel = parseFloat(threatRate) > 10 ? "HIGH" : parseFloat(threatRate) > 3 ? "MEDIUM" : "LOW";

      const systemContext = `
You are SENTINEL-AI, an elite cybersecurity analyst embedded in the NIDS_PRO Network Intrusion Detection System.
You have direct access to live network telemetry data and ML model outputs.
Your analysis must be precise, actionable, and technically authoritative.

═══ LIVE THREAT INTELLIGENCE ═══
Risk Level: ${riskLevel} (${threatRate}% threat rate)
Total Packets Analyzed: ${trafficStats.totalPackets.toLocaleString()}
Anomalies Detected: ${trafficStats.anomaliesDetected} (${threatRate}%)
Attack Type Breakdown: ${JSON.stringify(attackDist, null, 0)}

${latestStats ? `═══ SYSTEM TELEMETRY ═══
CPU Usage: ${latestStats.cpuUsage?.toFixed(1)}% ${(latestStats.cpuUsage || 0) > 80 ? "⚠ ELEVATED" : "✓ NORMAL"}
Memory Usage: ${latestStats.memoryUsage?.toFixed(1)}% ${(latestStats.memoryUsage || 0) > 85 ? "⚠ HIGH" : "✓ NORMAL"}
Network Throughput: ${latestStats.networkThroughput?.toFixed(0)} Mbps
Active Connections: ${latestStats.activeConnections}` : ""}

═══ ML DETECTION ENGINES ═══
${models.map(m => `• ${m.name} [${m.type}]: ${m.status.toUpperCase()} | Accuracy: ${((m.accuracy || 0) * 100).toFixed(1)}%`).join('\n')}

═══ RECENT THREAT EVENTS ═══
${anomalyLogs.length > 0 ? anomalyLogs.map(l =>
  `• [${l.attackType}] ${l.sourceIp} → ${l.destinationIp} | ${l.protocol} | Confidence: ${((l.confidenceScore || 0) * 100).toFixed(0)}% | "${l.info}"`
).join('\n') : "No recent threats detected — system appears clean."}
      `.trim();

      const userPrompt = question
        ? `Question from security operator: ${question}\n\nProvide a detailed, technically precise answer with specific recommendations.`
        : `Perform a comprehensive security analysis and provide:

## 1. Threat Assessment
Evaluate the current risk level with specific metrics.

## 2. Active Threats
Detail any ongoing or recent attack patterns.

## 3. Immediate Response Actions
List concrete steps to take right now (prioritized).

## 4. ML Model Performance
Assess detection engine effectiveness and suggest improvements.

## 5. Network Hardening Recommendations
Provide 3-5 specific, implementable security measures.

## 6. Risk Forecast
Predict likely next attack vectors based on current patterns.

Format with markdown. Be concise, technical, and actionable. Use bullet points. Include specific IPs, protocols, and attack types from the data.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemContext },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_completion_tokens: 8192,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      console.error("AI suggestions error:", err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "AI analysis failed. Please try again." })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "AI suggestions failed" });
      }
    }
  });

  // === Seed Data ===
  await seedDatabase();

  // === Background system stats simulator ===
  startSystemStatsSimulator();

  return httpServer;
}

function startSystemStatsSimulator() {
  setInterval(async () => {
    try {
      const stat = await storage.createSystemStat({
        cpuUsage: 20 + Math.random() * 60,
        memoryUsage: 40 + Math.random() * 30,
        networkThroughput: 500 + Math.random() * 1000,
        activeConnections: Math.floor(50 + Math.random() * 200),
      });
      broadcast({ type: "system_stats", data: stat });
    } catch (_) {}
  }, 5000);
}

async function seedDatabase() {
  const models = await storage.getMlModels();
  if (models.length === 0) {
    await db.insert(schema.mlModels).values([
      { name: "Random Forest Classifier", type: "Classification", accuracy: 0.98, status: "active", lastTrained: new Date() },
      { name: "Deep Autoencoder", type: "Anomaly Detection", accuracy: 0.95, status: "active", lastTrained: new Date() },
      { name: "LSTM Network", type: "Sequence Analysis", accuracy: 0.92, status: "active", lastTrained: new Date() },
    ]);

    await storage.createTrafficLog({
      sourceIp: "192.168.1.105",
      destinationIp: "10.0.0.1",
      protocol: "TCP",
      length: 512,
      info: "Normal HTTP Request",
      isAnomaly: false,
      attackType: "Normal",
      confidenceScore: 0.05,
    });

    await storage.createTrafficLog({
      sourceIp: "45.33.22.11",
      destinationIp: "10.0.0.1",
      protocol: "TCP",
      length: 64,
      info: "SYN Scan Detected",
      isAnomaly: true,
      attackType: "Port Scan",
      confidenceScore: 0.98,
    });
  }
}
