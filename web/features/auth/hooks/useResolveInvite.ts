import { useQuery } from "@tanstack/react-query"

import { resolveInvite } from "../api/invitation.api"

export const useResolveInvite = (token?: string | null) => {
  return useQuery({
    queryKey: ["invite", "resolve", token],
    queryFn: () => resolveInvite(token!),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60 * 1000,
  })
}
