import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useSystemStats() {
  return useQuery({
    queryKey: [api.system.stats.path],
    queryFn: async () => {
      const res = await fetch(api.system.stats.path);
      if (!res.ok) throw new Error("Failed to fetch system stats");
      return api.system.stats.responses[200].parse(await res.json());
    },
    refetchInterval: 3000,
  });
}
