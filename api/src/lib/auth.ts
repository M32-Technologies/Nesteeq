import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { mongodbAdapter } from "@better-auth/mongo-adapter"
import { getAuthDB, getAuthMongoClient } from "../config/auth-db.js"
import { env } from "../config/env.js"
import { admin, customSession, emailOTP } from "better-auth/plugins"
import { emailService } from "../services/EmailService.js"
import { Apartment } from "../modules/apartment/apartment.model.js"
import { isValidObjectId } from "mongoose"
import { emitUserForceLogout } from "../socket/socket.js"

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
    after: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path.endsWith("/admin/ban-user") ||
        (ctx.path.endsWith("/admin/update-user") && (ctx.body as { banned?: boolean })?.banned === true)
      ) {
        const returned = (ctx.context as { returned?: unknown })?.returned;
        const isError =
          !returned ||
          returned instanceof Error ||
          (typeof returned === "object" && "statusCode" in (returned as Record<string, unknown>));

        if (!isError) {
          const body = ctx.body as { userId?: string; banReason?: string } | undefined;
          const userObj = (returned as { user?: { id?: string } })?.user;
          const targetUserId = body?.userId || userObj?.id;

          if (typeof targetUserId === "string" && targetUserId.trim()) {
            emitUserForceLogout(targetUserId.trim(), {
              reason: body?.banReason || "Your account has been suspended by an administrator.",
              banned: true,
            });
          }
        }
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
        console.log(`\n=========================================`)
        console.log(`🔑 [DEV OTP] Type: ${type}`)
        console.log(`📧 Email: ${email}`)
        console.log(`🔢 Code:  ${otp}`)
        console.log(`=========================================\n`)
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
    customSession(async ({ user, session }) => {
      let apartmentStatus: string | null = null;
      let inactiveReason: string | null = null;
      let apartmentName: string | null = null;

      const rawUser = user as { role?: string; apartmentId?: string; id?: string };
      const userRole = (rawUser.role ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
      if (userRole !== "admin" && userRole !== "super_admin") {
        let apartmentId = rawUser.apartmentId;
        if (!apartmentId && userRole === "property_manager" && rawUser.id) {
          const apt = await Apartment.findOne({ managerId: rawUser.id }).select("_id status name inactiveReason");
          if (apt) {
            apartmentId = apt._id.toString();
          }
        }

        if (apartmentId && isValidObjectId(apartmentId)) {
          const apt = await Apartment.findById(apartmentId).select("name status inactiveReason");
          if (apt) {
            apartmentStatus = apt.status;
            inactiveReason = apt.inactiveReason ?? null;
            apartmentName = apt.name;
          }
        }
      }

      return {
        user: {
          ...user,
          apartmentStatus,
          inactiveReason,
          apartmentName,
        },
        session,
      };
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
