import { useQuery } from "@tanstack/react-query"
import {
  fetchComplaints,
  fetchComplaintById,
  fetchComplaintStats,
} from "../api/complaints.api"
import type { ComplaintQuery } from "../types/complaints.types"

export const complaintQueryKeys = {
  all: ["facility-complaints"] as const,
  list: (query?: ComplaintQuery) => [...complaintQueryKeys.all, "list", query] as const,
  details: (id: string) => [...complaintQueryKeys.all, "details", id] as const,
  stats: () => [...complaintQueryKeys.all, "stats"] as const,
}

export function useComplaints(query?: ComplaintQuery) {
  return useQuery({
    queryKey: complaintQueryKeys.list(query),
    queryFn: () => fetchComplaints(query),
    staleTime: 30 * 1000,
  })
}

export function useComplaint(id: string | null) {
  return useQuery({
    queryKey: complaintQueryKeys.details(id ?? ""),
    queryFn: () => fetchComplaintById(id!),
    enabled: Boolean(id),
  })
}

export function useComplaintStats() {
  return useQuery({
    queryKey: complaintQueryKeys.stats(),
    queryFn: fetchComplaintStats,
    staleTime: 60 * 1000,
  })
}
