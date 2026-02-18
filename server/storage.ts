
import { db } from "./db";
import {
  users, trafficLogs, systemStats, mlModels,
  type User, type InsertUser,
  type TrafficLog, type InsertTrafficLog,
  type SystemStat, type InsertSystemStat,
  type MlModel, type InsertMlModel
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Traffic Logs
  getTrafficLogs(limit?: number, type?: string): Promise<TrafficLog[]>;
  createTrafficLog(log: InsertTrafficLog): Promise<TrafficLog>;
  getTrafficStats(): Promise<{
    totalPackets: number;
    anomaliesDetected: number;
    attackTypesDistribution: Record<string, number>;
  }>;

  // System Stats
  getSystemStats(limit?: number): Promise<SystemStat[]>;
  createSystemStat(stat: InsertSystemStat): Promise<SystemStat>;

  // ML Models
  getMlModels(): Promise<MlModel[]>;
  getMlModel(id: number): Promise<MlModel | undefined>;
  updateMlModelStatus(id: number, status: string): Promise<MlModel>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Traffic methods
  async getTrafficLogs(limit = 100, type?: string): Promise<TrafficLog[]> {
    let query = db.select().from(trafficLogs).orderBy(desc(trafficLogs.timestamp)).limit(limit);
    
    if (type) {
      // If type is "anomaly", filter where isAnomaly is true
      if (type === "anomaly") {
        query.where(eq(trafficLogs.isAnomaly, true));
      } else {
        query.where(eq(trafficLogs.attackType, type));
      }
    }
    
    return await query;
  }

  async createTrafficLog(log: InsertTrafficLog): Promise<TrafficLog> {
    const [newLog] = await db.insert(trafficLogs).values(log).returning();
    return newLog;
  }

  async getTrafficStats() {
    const [total] = await db.select({ count: sql<number>`count(*)` }).from(trafficLogs);
    const [anomalies] = await db.select({ count: sql<number>`count(*)` }).from(trafficLogs).where(eq(trafficLogs.isAnomaly, true));
    
    // Distribution
    const distribution = await db
      .select({ 
        type: trafficLogs.attackType, 
        count: sql<number>`count(*)` 
      })
      .from(trafficLogs)
      .groupBy(trafficLogs.attackType);

    const distMap: Record<string, number> = {};
    distribution.forEach(d => {
      if (d.type) distMap[d.type] = Number(d.count);
    });

    return {
      totalPackets: Number(total?.count || 0),
      anomaliesDetected: Number(anomalies?.count || 0),
      attackTypesDistribution: distMap
    };
  }

  // System Stats
  async getSystemStats(limit = 50): Promise<SystemStat[]> {
    return await db.select().from(systemStats).orderBy(desc(systemStats.recordedAt)).limit(limit);
  }

  async createSystemStat(stat: InsertSystemStat): Promise<SystemStat> {
    const [newStat] = await db.insert(systemStats).values(stat).returning();
    return newStat;
  }

  // ML Models
  async getMlModels(): Promise<MlModel[]> {
    return await db.select().from(mlModels);
  }

  async getMlModel(id: number): Promise<MlModel | undefined> {
    const [model] = await db.select().from(mlModels).where(eq(mlModels.id, id));
    return model;
  }

  async updateMlModelStatus(id: number, status: string): Promise<MlModel> {
    const [model] = await db.update(mlModels)
      .set({ status, lastTrained: new Date() })
      .where(eq(mlModels.id, id))
      .returning();
    return model;
  }
}

export const storage = new DatabaseStorage();
