
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "./db";
import * as schema from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Traffic Endpoints ===
  
  app.get(api.traffic.list.path, async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const type = req.query.type as string | undefined;
    const logs = await storage.getTrafficLogs(limit, type);
    res.json(logs);
  });

  app.get(api.traffic.stats.path, async (req, res) => {
    const stats = await storage.getTrafficStats();
    // Calculate a mock throughput for demo purposes
    const throughput = Math.floor(Math.random() * 1000) + 500; // 500-1500 Mbps
    res.json({ ...stats, throughput });
  });

  app.post(api.traffic.log.path, async (req, res) => {
    try {
      const input = api.traffic.log.input.parse(req.body);
      const log = await storage.createTrafficLog(input);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === ML Model Endpoints ===

  app.get(api.models.list.path, async (req, res) => {
    const models = await storage.getMlModels();
    // If no models exist, seed them (in memory fallback behavior handled by DB seed usually)
    res.json(models);
  });

  app.post(api.models.train.path, async (req, res) => {
    const id = Number(req.params.id);
    const model = await storage.getMlModel(id);
    if (!model) {
      return res.status(404).json({ message: "Model not found" });
    }

    // Simulate training process
    await storage.updateMlModelStatus(id, "training");
    
    // In a real app, this would trigger a Python script
    setTimeout(async () => {
      await storage.updateMlModelStatus(id, "active");
    }, 5000);

    res.json({ status: "success", message: `Training started for ${model.name}` });
  });

  // === Simulation Endpoints ===

  app.post(api.simulation.start.path, async (req, res) => {
    const input = api.simulation.start.input.parse(req.body);
    
    // Start a background interval to generate fake traffic matching the simulation parameters
    const jobId = randomBytes(4).toString("hex");
    
    console.log(`Starting simulation: ${input.attackType} for ${input.durationSeconds}s`);
    
    let elapsed = 0;
    const interval = setInterval(async () => {
      if (elapsed >= input.durationSeconds) {
        clearInterval(interval);
        return;
      }
      
      // Generate packet
      const isAttack = input.attackType !== "normal";
      await storage.createTrafficLog({
        sourceIp: isAttack ? `192.168.1.${Math.floor(Math.random() * 255)}` : "10.0.0.5",
        destinationIp: "10.0.0.1",
        protocol: Math.random() > 0.5 ? "TCP" : "UDP",
        length: Math.floor(Math.random() * 1500),
        info: isAttack ? `Suspicious payload detected: ${input.attackType}` : "Normal traffic",
        isAnomaly: isAttack,
        attackType: isAttack ? input.attackType : "Normal",
        confidenceScore: isAttack ? 0.8 + Math.random() * 0.2 : 0.1,
      });

      elapsed += 1;
    }, 1000); // 1 packet per second for demo

    res.json({ message: "Simulation started", jobId });
  });

  // === System Stats Endpoints ===

  app.get(api.system.stats.path, async (req, res) => {
    const stats = await storage.getSystemStats();
    res.json(stats);
  });

  // === AI Suggestions Endpoint ===

  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const { question } = req.body;

      // Gather current system context
      const [trafficStats, recentLogs, models, systemStatsList] = await Promise.all([
        storage.getTrafficStats(),
        storage.getTrafficLogs(20),
        storage.getMlModels(),
        storage.getSystemStats(5),
      ]);

      const latestStats = systemStatsList[0];
      const anomalyLogs = recentLogs.filter(l => l.isAnomaly).slice(0, 8);
      const attackDist = trafficStats.attackTypesDistribution;

      const systemContext = `
You are an expert cybersecurity AI analyst for a Network Intrusion Detection System (NIDS) called NIDS_PRO.
Your job is to analyze real-time network data and provide actionable security recommendations.

CURRENT SYSTEM STATE:
- Total Packets Analyzed: ${trafficStats.totalPackets}
- Anomalies/Threats Detected: ${trafficStats.anomaliesDetected}
- Threat Rate: ${trafficStats.totalPackets > 0 ? ((trafficStats.anomaliesDetected / trafficStats.totalPackets) * 100).toFixed(2) : 0}%
- Attack Type Distribution: ${JSON.stringify(attackDist)}
${latestStats ? `- CPU Usage: ${latestStats.cpuUsage?.toFixed(1)}%
- Memory Usage: ${latestStats.memoryUsage?.toFixed(1)}%
- Network Throughput: ${latestStats.networkThroughput?.toFixed(0)} Mbps
- Active Connections: ${latestStats.activeConnections}` : ''}

ML MODELS STATUS:
${models.map(m => `- ${m.name} (${m.type}): ${m.status}, Accuracy: ${((m.accuracy || 0) * 100).toFixed(1)}%`).join('\n')}

RECENT THREAT EVENTS (last 8 anomalies):
${anomalyLogs.length > 0 ? anomalyLogs.map(l =>
  `- [${l.attackType}] Source: ${l.sourceIp} → ${l.destinationIp} | Protocol: ${l.protocol} | Confidence: ${((l.confidenceScore || 0) * 100).toFixed(0)}%`
).join('\n') : '- No recent anomalies detected'}
      `.trim();

      const userPrompt = question
        ? `Based on the system state above, please answer this specific question and provide relevant security recommendations:\n\n${question}`
        : `Based on the system state above, provide a comprehensive security analysis with:
1. Threat Assessment - current risk level and main concerns
2. Immediate Actions - what should be done right now (if any threats)
3. Security Recommendations - 3-5 specific, actionable improvements
4. ML Model Insights - suggestions for improving detection accuracy
5. Network Hardening Tips - preventive measures tailored to the observed traffic patterns

Format your response with clear sections using markdown headings. Be concise and technical.`;

      // Stream the AI response
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

  // === Seed Data (Run on startup if empty) ===
  await seedDatabase();

  // === Background system stats simulator ===
  startSystemStatsSimulator();

  return httpServer;
}

function startSystemStatsSimulator() {
  setInterval(async () => {
    try {
      await storage.createSystemStat({
        cpuUsage: 20 + Math.random() * 60,
        memoryUsage: 40 + Math.random() * 30,
        networkThroughput: 500 + Math.random() * 1000,
        activeConnections: Math.floor(50 + Math.random() * 200),
      });
    } catch (_) {}
  }, 5000);
}

async function seedDatabase() {
  const models = await storage.getMlModels();
  if (models.length === 0) {
    // Seed Models
    /* 
      The user requested: 
      - Random Forest
      - Autoencoder
      - LSTM
    */
    // Use raw query for seeding if create method is strictly typed to exclude ID
    // But here we just use the storage method
    // Note: Drizzle's insert values doesn't usually take ID if serial, but we aren't passing ID
    
    // We need to bypass the storage interface for seeding to simple insert
    // Or just rely on the fact that storage.createMlModel doesn't exist yet, let's add it or just use db direct
    
    await db.insert(schema.mlModels).values([
      { name: "Random Forest Classifier", type: "Classification", accuracy: 0.98, status: "active", lastTrained: new Date() },
      { name: "Deep Autoencoder", type: "Anomaly Detection", accuracy: 0.95, status: "active", lastTrained: new Date() },
      { name: "LSTM Network", type: "Sequence Analysis", accuracy: 0.92, status: "active", lastTrained: new Date() },
    ]);

    // Seed some initial traffic
    await storage.createTrafficLog({
      sourceIp: "192.168.1.105",
      destinationIp: "10.0.0.1",
      protocol: "TCP",
      length: 512,
      info: "Normal HTTP Request",
      isAnomaly: false,
      attackType: "Normal",
      confidenceScore: 0.05
    });
    
    await storage.createTrafficLog({
      sourceIp: "45.33.22.11",
      destinationIp: "10.0.0.1",
      protocol: "TCP",
      length: 64,
      info: "SYN Scan Detected",
      isAnomaly: true,
      attackType: "Port Scan",
      confidenceScore: 0.98
    });
  }
}
