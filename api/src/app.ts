import cookieParser from "cookie-parser"
import express from "express"
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors"
import { env } from "./config/env.js";

import SubscriptionsRoute from "../src/modules/subscription/subscription.routes.js"
import ComplaintsRoute from "../src/modules/complaint/complaint.routes.js"
import MaintenanceRoute from "../src/modules/maintenance/maintenance.routes.js"
import TechnicianRoute from "../src/modules/technician/technician.routes.js"
import ReportRoute from "../src/modules/report/report.routes.js"
import ScheduleRoute from "../src/modules/schedule/schedule.routes.js"
import AlertRoute from "../src/modules/alert/alert.routes.js"
import FacilityRoute from "../src/modules/facility/facility.routes.js"
const app = express()
app.use(cors({
  origin : env.webUrl,
  credentials : true ,
}))

app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(cookieParser());
app.use(express.json())

app.use("/api/v1" , SubscriptionsRoute)
app.use("/api/v1" , ComplaintsRoute)
app.use("/api/v1" , MaintenanceRoute)
app.use("/api/v1" , TechnicianRoute)
app.use("/api/v1" , ReportRoute)
app.use("/api/v1" , ScheduleRoute)
app.use("/api/v1" , AlertRoute)
app.use("/api/v1" , FacilityRoute)
app.use(notFoundHandler);
app.use(errorHandler);

export default app
