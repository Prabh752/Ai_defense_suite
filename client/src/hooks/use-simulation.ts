import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type SimulationInput = z.infer<typeof api.simulation.start.input>;

export function useStartSimulation() {
  return useMutation({
    mutationFn: async (data: SimulationInput) => {
      const res = await fetch(api.simulation.start.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to start simulation");
      return api.simulation.start.responses[200].parse(await res.json());
    },
  });
}
