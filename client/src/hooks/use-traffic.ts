import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertTrafficLog } from "@shared/routes";

export function useTrafficLogs(params?: { limit?: number; type?: string }) {
  return useQuery({
    queryKey: [api.traffic.list.path, params],
    queryFn: async () => {
      const url = new URL(api.traffic.list.path, window.location.origin);
      if (params?.limit) url.searchParams.set("limit", params.limit.toString());
      if (params?.type) url.searchParams.set("type", params.type);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch traffic logs");
      return api.traffic.list.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Live polling
  });
}

export function useTrafficStats() {
  return useQuery({
    queryKey: [api.traffic.stats.path],
    queryFn: async () => {
      const res = await fetch(api.traffic.stats.path);
      if (!res.ok) throw new Error("Failed to fetch traffic stats");
      return api.traffic.stats.responses[200].parse(await res.json());
    },
    refetchInterval: 5000,
  });
}

export function useCreateLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTrafficLog) => {
      const res = await fetch(api.traffic.log.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create log");
      return api.traffic.log.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.traffic.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.traffic.stats.path] });
    },
  });
}
