import { useQuery } from "@tanstack/react-query"
import { resolveInvite } from "../api/invitation.api"

export const useResolveInvite = (token: string | null) => {
  return useQuery({
    queryKey: ["invite", token],
    queryFn: () => resolveInvite(token as string),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  })
}
