
import { db, isDatabaseEnabled } from "./db";
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
  createMlModel(model: InsertMlModel): Promise<MlModel>;
  updateMlModelStatus(id: number, status: string): Promise<MlModel>;
  clearTrafficLogs(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor(private readonly database: NonNullable<typeof db>) {}

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.database.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.database.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.database.insert(users).values(insertUser).returning();
    return user;
  }

  // Traffic methods
  async getTrafficLogs(limit = 100, type?: string): Promise<TrafficLog[]> {
    if (!type) {
      return await this.database
        .select()
        .from(trafficLogs)
        .orderBy(desc(trafficLogs.timestamp))
        .limit(limit);
    }

    if (type === "anomaly") {
      return await this.database
        .select()
        .from(trafficLogs)
        .where(eq(trafficLogs.isAnomaly, true))
        .orderBy(desc(trafficLogs.timestamp))
        .limit(limit);
    }

    return await this.database
      .select()
      .from(trafficLogs)
      .where(eq(trafficLogs.attackType, type))
      .orderBy(desc(trafficLogs.timestamp))
      .limit(limit);
  }

  async createTrafficLog(log: InsertTrafficLog): Promise<TrafficLog> {
    const [newLog] = await this.database.insert(trafficLogs).values(log).returning();
    return newLog;
  }

  async getTrafficStats() {
    const [total] = await this.database.select({ count: sql<number>`count(*)` }).from(trafficLogs);
    const [anomalies] = await this.database
      .select({ count: sql<number>`count(*)` })
      .from(trafficLogs)
      .where(eq(trafficLogs.isAnomaly, true));
    
    // Distribution
    const distribution = await this.database
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
    return await this.database.select().from(systemStats).orderBy(desc(systemStats.recordedAt)).limit(limit);
  }

  async createSystemStat(stat: InsertSystemStat): Promise<SystemStat> {
    const [newStat] = await this.database.insert(systemStats).values(stat).returning();
    return newStat;
  }

  // ML Models
  async getMlModels(): Promise<MlModel[]> {
    return await this.database.select().from(mlModels);
  }

  async getMlModel(id: number): Promise<MlModel | undefined> {
    const [model] = await this.database.select().from(mlModels).where(eq(mlModels.id, id));
    return model;
  }

  async createMlModel(model: InsertMlModel): Promise<MlModel> {
    const [newModel] = await this.database.insert(mlModels).values(model).returning();
    return newModel;
  }

  async updateMlModelStatus(id: number, status: string): Promise<MlModel> {
    const [model] = await this.database.update(mlModels)
      .set({ status, lastTrained: new Date() })
      .where(eq(mlModels.id, id))
      .returning();
    return model;
  }

  async clearTrafficLogs(): Promise<void> {
    await this.database.delete(trafficLogs);
  }
}

export class MemoryStorage implements IStorage {
  private usersData: User[] = [];
  private trafficLogsData: TrafficLog[] = [];
  private systemStatsData: SystemStat[] = [];
  private mlModelsData: MlModel[] = [];

  private userId = 1;
  private trafficLogId = 1;
  private systemStatId = 1;
  private mlModelId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersData.find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.userId++,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role ?? "admin",
      createdAt: new Date(),
    };
    this.usersData.push(user);
    return user;
  }

  async getTrafficLogs(limit = 100, type?: string): Promise<TrafficLog[]> {
    let logs = [...this.trafficLogsData];
    if (type === "anomaly") {
      logs = logs.filter((l) => l.isAnomaly === true);
    } else if (type) {
      logs = logs.filter((l) => l.attackType === type);
    }

    logs.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });
    return logs.slice(0, limit);
  }

  async createTrafficLog(log: InsertTrafficLog): Promise<TrafficLog> {
    const newLog: TrafficLog = {
      id: this.trafficLogId++,
      timestamp: new Date(),
      sourceIp: log.sourceIp,
      destinationIp: log.destinationIp,
      protocol: log.protocol,
      length: log.length,
      info: log.info ?? null,
      isAnomaly: log.isAnomaly ?? false,
      attackType: log.attackType ?? null,
      confidenceScore: log.confidenceScore ?? null,
    };
    this.trafficLogsData.push(newLog);
    return newLog;
  }

  async getTrafficStats() {
    const totalPackets = this.trafficLogsData.length;
    const anomaliesDetected = this.trafficLogsData.filter((l) => l.isAnomaly).length;
    const attackTypesDistribution: Record<string, number> = {};

    for (const log of this.trafficLogsData) {
      if (!log.attackType) continue;
      attackTypesDistribution[log.attackType] = (attackTypesDistribution[log.attackType] || 0) + 1;
    }

    return { totalPackets, anomaliesDetected, attackTypesDistribution };
  }

  async getSystemStats(limit = 50): Promise<SystemStat[]> {
    const stats = [...this.systemStatsData];
    stats.sort((a, b) => {
      const aTime = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
      const bTime = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
      return bTime - aTime;
    });
    return stats.slice(0, limit);
  }

  async createSystemStat(stat: InsertSystemStat): Promise<SystemStat> {
    const newStat: SystemStat = {
      id: this.systemStatId++,
      cpuUsage: stat.cpuUsage ?? null,
      memoryUsage: stat.memoryUsage ?? null,
      networkThroughput: stat.networkThroughput ?? null,
      activeConnections: stat.activeConnections ?? null,
      recordedAt: new Date(),
    };
    this.systemStatsData.push(newStat);
    return newStat;
  }

  async getMlModels(): Promise<MlModel[]> {
    return [...this.mlModelsData];
  }

  async getMlModel(id: number): Promise<MlModel | undefined> {
    return this.mlModelsData.find((m) => m.id === id);
  }

  async createMlModel(model: InsertMlModel): Promise<MlModel> {
    const newModel: MlModel = {
      id: this.mlModelId++,
      name: model.name,
      type: model.type,
      status: model.status ?? "active",
      accuracy: model.accuracy ?? null,
      lastTrained: model.lastTrained ?? null,
      path: model.path ?? null,
    };
    this.mlModelsData.push(newModel);
    return newModel;
  }

  async updateMlModelStatus(id: number, status: string): Promise<MlModel> {
    const model = this.mlModelsData.find((m) => m.id === id);
    if (!model) {
      throw new Error("Model not found");
    }
    model.status = status;
    model.lastTrained = new Date();
    return model;
  }

  async clearTrafficLogs(): Promise<void> {
    this.trafficLogsData = [];
  }
}

export const storage: IStorage =
  isDatabaseEnabled && db ? new DatabaseStorage(db) : new MemoryStorage();
