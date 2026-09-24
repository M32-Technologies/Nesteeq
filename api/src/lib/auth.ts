import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { mongodbAdapter } from "@better-auth/mongo-adapter"
import { getAuthDB, getAuthMongoClient } from "../config/auth-db.js"
import { env } from "../config/env.js"
import { admin, emailOTP } from "better-auth/plugins"
import { emailService } from "../services/EmailService.js"

export const auth = betterAuth({
  database: mongodbAdapter(getAuthDB(), {
    client: getAuthMongoClient()
  }),
  baseURL: env.betterAuthUrl,
  trustedOrigins: [env.webUrl],
  secret: env.betterAuthSecret,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: false,
    }
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/email-otp/send-verification-otp") {
        const email = typeof ctx.body?.email === "string"
          ? ctx.body.email.toLowerCase()
          : null
        const type = ctx.body?.type

        if (email && type === "sign-in") {
          const existingUser = await ctx.context.internalAdapter.findUserByEmail(email)
          const role = (existingUser?.user as { role?: string } | undefined)?.role
          if (role && role.trim().toLowerCase() === "admin") {
            throw new APIError("FORBIDDEN", {
              code: "ADMIN_LOGIN_RESTRICTED",
              message: "Administrator accounts cannot sign in via OTP.",
            })
          }
        }
        return
      }


      if (ctx.path === "/sign-in/email-otp") {
        const email = typeof ctx.body?.email === "string"
          ? ctx.body.email.toLowerCase()
          : null
        const name = typeof ctx.body?.name === "string"
          ? ctx.body.name.trim()
          : ""

        if (!email) return

        const existingUser = await ctx.context.internalAdapter.findUserByEmail(email)
        if (!existingUser && !name) {
          throw new APIError("BAD_REQUEST", {
            code: "USER_NOT_FOUND",
            message: "No account was found for this email. Please register first.",
          })
        }

        const role = (existingUser?.user as { role?: string } | undefined)?.role
        if (role && role.trim().toLowerCase() === "admin") {
          throw new APIError("FORBIDDEN", {
            code: "ADMIN_LOGIN_RESTRICTED",
            message: "Administrator accounts cannot sign in via OTP. Please use the Admin Portal",
          })
        }

        return
      }

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
  },
  plugins: [
    emailOTP({
      expiresIn: 5 * 60,
      otpLength: 6,
      allowedAttempts: 3,
      disableSignUp: false,
      sendVerificationOnSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type == "sign-in") {
          await emailService.sendLoginOtp(email, otp)
        } else if (type == "email-verification") {
          await emailService.sendVerificationOtp(email, otp)
        }
      },  
    }),
    admin({
      defaultRole: "resident",
      adminRoles: ["admin"],
    }),
    
  ],
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      apartmentId: { type: "string", required: false },
      flatId: { type: "string", required: false },
    },
  },
})
