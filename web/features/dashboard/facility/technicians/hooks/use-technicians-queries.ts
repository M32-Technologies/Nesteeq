import { useQuery } from "@tanstack/react-query"
import { fetchTechnicians, fetchTechnicianById } from "../api/technicians.api"
import type { TechnicianQuery } from "../types/technicians.types"

export const technicianQueryKeys = {
  all: ["facility-technicians"] as const,
  list: (query?: TechnicianQuery) => [...technicianQueryKeys.all, "list", query] as const,
  details: (id: string) => [...technicianQueryKeys.all, "details", id] as const,
}

export function useTechniciansQuery(query?: TechnicianQuery) {
  return useQuery({
    queryKey: technicianQueryKeys.list(query),
    queryFn: () => fetchTechnicians(query),
    staleTime: 30 * 1000,
  })
}

export function useTechnicianDetailsQuery(id: string | null) {
  return useQuery({
    queryKey: technicianQueryKeys.details(id ?? ""),
    queryFn: () => fetchTechnicianById(id!),
    enabled: Boolean(id),
  })
}
