import { createAuthClient } from "better-auth/react"
import { emailOTPClient, inferAdditionalFields , adminClient} from "better-auth/client/plugins"


export const authClient = createAuthClient({
    baseURL : process.env.NEXT_PUBLIC_API_URL,
    plugins: [
        emailOTPClient(),
        inferAdditionalFields({
            user: {
                phone: {
                    type: "string",
                    required: false,
                },
                role: {
                    type: "string",
                    required: true,
                    defaultValue: "resident",
                },
                apartmentId: {
                    type: "string",
                    required: false,
                },
                flatId: {
                    type: "string",
                    required: false,
                },
            },
        }),
        adminClient()
    ],
})

export const { signIn, signUp, signOut, useSession } = authClient;

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return role.trim().toLowerCase() === "admin";
}

