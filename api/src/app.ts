import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/errorHandler.js";

import { env } from "./config/env.js";
import apartmentRoutes from "./modules/apartment/apartment.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import subscriptionRoutes from "./modules/subscription/subscription.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

app.use("/api/apartments", apartmentRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/subscriptions", subscriptionRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
