import crypto from "node:crypto"
import { createHash } from "node:crypto"
export function generateInviteToken() {
    const rawToken = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
    return { rawToken, tokenHash }
}

export const hashToken = (rawToken: string) => createHash("sha256").update(rawToken).digest("hex")