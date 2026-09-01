import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import { toNodeHandler } from "better-auth/node";

import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { auth } from "./lib/auth.js";
import { env } from "./config/env.js";

import expenseRoutes from "./modules/expense/expense.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import SubscriptionsRoute from "./modules/subscription/subscription.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import financeRoutes from "./modules/finance/finance.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
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

app.use("/api/v1", SubscriptionsRoute);
app.use("/api/bills", billingRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/visitors", visitorsRoutes);
app.use("/api/security/deliveries", deliveryRoutes);
app.use("/api/security/parking", parkingRoutes);
app.use("/api/security/alerts", alertRoutes);
app.use("/api/security", securityRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
