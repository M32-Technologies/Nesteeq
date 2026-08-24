import { useMutation } from "@tanstack/react-query"

import { acceptInvite } from "../api/invitation.api"

export const useAcceptInvite = () => {
  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
  })
}
