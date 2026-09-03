import { redirect } from "next/navigation"

export default async function AcceptInviteRoute({
  searchParams,
}: PageProps<"/accept-invite">) {
  const params = await searchParams
  const rawToken = params.token ?? params.invite
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  if (!token) {
    redirect("/login")
  }

  redirect(`/login?token=${encodeURIComponent(token)}`)
}
