import cookieParser from "cookie-parser"
import express from "express"
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors"
import { env } from "./config/env.js";

import SubscriptionsRoute from "../src/modules/subscription/subscription.routes.js"
import ResidentRoute from "../src/modules/resident/resident.routes.js"
import InvitationRoute from "../src/modules/invitation/invitation.routes.js"
import StaffRoute from "../src/modules/staff/staff.routes.js"
const app = express()
app.use(cors({
  origin : env.webUrl,
  credentials : true ,
}))

app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(cookieParser());
app.use(express.json())

app.use("/api/v1" , SubscriptionsRoute)
app.use("/api/v1/residents" , ResidentRoute)
app.use("/api/v1/invitations" , InvitationRoute)
app.use("/api/v1/staff" , StaffRoute)

app.use(notFoundHandler);
app.use(errorHandler);

export default app
