import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import { toNodeHandler } from "better-auth/node";

import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { auth } from "./lib/auth.js";
import { env } from "./config/env.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import expenseRoutes from "./modules/expense/expense.routes.js";
import financeRoutes from "./modules/finance/finance.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import SubscriptionsRoute from "./modules/subscription/subscription.routes.js";
import ResidentRoute from "./modules/resident/resident.routes.js";
import InvitationRoute from "./modules/invitation/invitation.routes.js";
import StaffRoute from "./modules/staff/staff.routes.js";
import BlockRoute from "./modules/block/block.routes.js";
import FlatRoute from "./modules/flat/flat.routes.js";
import ApartmentRoute from "./modules/apartment/apartment.routes.js";
import visitorsRoutes from "./modules/visitors/routes.js";
import securityRoutes from "./modules/security/security.routes.js";
import deliveryRoutes from "./modules/delivery/delivery.routes.js";
import parkingRoutes from "./modules/parking/parking.routes.js";
import alertRoutes from "./modules/alert/alert.routes.js";

const app = express();

app.use(
  cors({
    origin: env.webUrl,
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/apartment", ApartmentRoute);
app.use("/api/v1", SubscriptionsRoute);
app.use("/api/v1/residents", ResidentRoute);
app.use("/api/v1/invitations", InvitationRoute);
app.use("/api/v1/staff", StaffRoute);
app.use("/api/v1/blocks", BlockRoute);
app.use("/api/v1/flats", FlatRoute);
app.use("/api/v1/bills", billingRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/finance", financeRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/wallets", walletRoutes);
app.use("/api/v1/audit", auditRoutes);

app.use("/api/bills", billingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/audit", auditRoutes);

app.use("/api/visitors", visitorsRoutes);
app.use("/api/security/deliveries", deliveryRoutes);
app.use("/api/security/parking", parkingRoutes);
app.use("/api/security/alerts", alertRoutes);
app.use("/api/security", securityRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
