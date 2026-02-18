
import { z } from 'zod';
import { insertTrafficLogSchema, insertMlModelSchema, trafficLogs, mlModels, systemStats } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  traffic: {
    list: {
      method: 'GET' as const,
      path: '/api/traffic' as const,
      input: z.object({
        limit: z.coerce.number().optional(),
        type: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof trafficLogs.$inferSelect>()),
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/traffic/stats' as const,
      responses: {
        200: z.object({
          totalPackets: z.number(),
          anomaliesDetected: z.number(),
          attackTypesDistribution: z.record(z.number()),
          throughput: z.number(),
        }),
      },
    },
    log: {
      method: 'POST' as const,
      path: '/api/traffic' as const,
      input: insertTrafficLogSchema,
      responses: {
        201: z.custom<typeof trafficLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  models: {
    list: {
      method: 'GET' as const,
      path: '/api/models' as const,
      responses: {
        200: z.array(z.custom<typeof mlModels.$inferSelect>()),
      },
    },
    train: {
      method: 'POST' as const,
      path: '/api/models/:id/train' as const,
      responses: {
        200: z.object({ status: z.string(), message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  simulation: {
    start: {
      method: 'POST' as const,
      path: '/api/simulation/start' as const,
      input: z.object({
        attackType: z.enum(["ddos", "port_scan", "brute_force", "normal"]),
        durationSeconds: z.number().min(1).max(600),
        intensity: z.enum(["low", "medium", "high"]),
      }),
      responses: {
        200: z.object({ message: z.string(), jobId: z.string() }),
      },
    },
  },
  system: {
    stats: {
      method: 'GET' as const,
      path: '/api/system/stats' as const,
      responses: {
        200: z.array(z.custom<typeof systemStats.$inferSelect>()),
      },
    },
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
