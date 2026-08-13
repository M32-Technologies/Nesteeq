import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { mongodbAdapter } from "@better-auth/mongo-adapter"
import { getAuthDB, authMongoClient } from "../config/auth-db.js"
import { env } from "../config/env.js"
import { emailOTP } from "better-auth/plugins"
import { emailService } from "../services/EmailService.js"

export const auth = betterAuth({
  database: mongodbAdapter(getAuthDB(), {
    client: authMongoClient
  }),
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return

      const email = typeof ctx.body?.email === "string"
        ? ctx.body.email.toLowerCase()
        : null

      if (!email) return

      const existingUser = await ctx.context.internalAdapter.findUserByEmail(email)
      if (existingUser?.user.emailVerified) {
        throw new APIError("UNPROCESSABLE_ENTITY", {
          code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
          message: "User already exists. Use another email.",
        })
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await emailService.sendPasswordReset(user.email, url)
    },
  },
  baseURL: env.betterAuthUrl,
  trustedOrigins: [env.webUrl],
  secret: env.betterAuthSecret,
  plugins: [
    emailOTP({
      expiresIn: 5 * 60,
      otpLength: 6,
      allowedAttempts: 3,
      sendVerificationOnSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== "email-verification") return
        await emailService.sendVerificationOtp(email, otp)
      },
    }), 
  ],
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "RESIDENT" },
      phone: { type: "string", required: false },
      apartmentId: { type: "string", required: false },
      flatId: { type: "string", required: false },
    },
  },
})