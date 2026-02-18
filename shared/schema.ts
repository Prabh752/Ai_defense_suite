
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// User table for authentication (if needed for the project requirement)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // In a real app, this would be hashed. For this academic project, we'll store as is or simple hash.
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Network Traffic Logs (Simulated or Real)
export const trafficLogs = pgTable("traffic_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  sourceIp: text("source_ip").notNull(),
  destinationIp: text("destination_ip").notNull(),
  protocol: text("protocol").notNull(), // TCP, UDP, ICMP
  length: integer("length").notNull(),
  info: text("info"),
  isAnomaly: boolean("is_anomaly").default(false),
  attackType: text("attack_type"), // DDoS, Port Scan, Brute Force, Normal
  confidenceScore: doublePrecision("confidence_score"), // 0.0 to 1.0
});

// System System Stats for Dashboard
export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  cpuUsage: doublePrecision("cpu_usage"),
  memoryUsage: doublePrecision("memory_usage"),
  networkThroughput: doublePrecision("network_throughput"), // Mbps
  activeConnections: integer("active_connections"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// ML Model Metadata
export const mlModels = pgTable("ml_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Random Forest, Autoencoder, LSTM
  type: text("type").notNull(), // Classification, Anomaly Detection
  status: text("status").default("active"), // active, training, inactive
  accuracy: doublePrecision("accuracy"),
  lastTrained: timestamp("last_trained"),
  path: text("path"), // Path to the saved model file
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTrafficLogSchema = createInsertSchema(trafficLogs).omit({ id: true, timestamp: true });
export const insertSystemStatsSchema = createInsertSchema(systemStats).omit({ id: true, recordedAt: true });
export const insertMlModelSchema = createInsertSchema(mlModels).omit({ id: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TrafficLog = typeof trafficLogs.$inferSelect;
export type InsertTrafficLog = z.infer<typeof insertTrafficLogSchema>;

export type SystemStat = typeof systemStats.$inferSelect;
export type InsertSystemStat = z.infer<typeof insertSystemStatsSchema>;

export type MlModel = typeof mlModels.$inferSelect;
export type InsertMlModel = z.infer<typeof insertMlModelSchema>;

// === API CONTRACT TYPES ===

export type TrafficStatsResponse = {
  totalPackets: number;
  anomaliesDetected: number;
  attackTypesDistribution: Record<string, number>;
  recentLogs: TrafficLog[];
};

export type SimulationRequest = {
  attackType: "ddos" | "port_scan" | "brute_force" | "normal";
  durationSeconds: number;
  intensity: "low" | "medium" | "high";
};

export type PredictionRequest = {
  features: number[]; // Array of numerical features extracted from packet
  modelId?: number; // Optional specific model to use
};

export type PredictionResponse = {
  isAnomaly: boolean;
  attackType: string;
  confidence: number;
  modelUsed: string;
};
