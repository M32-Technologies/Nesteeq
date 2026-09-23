import { getAllApartmentHandler, getApartmentStatsHandler, getApartmentAnalyticsHandler, getSingleApartmentHandler, updateStatusHandler } from "./controller/apartment.controller.js";
import { getAllSubscriptionsHandler, getSubscriptionStatsHandler, getSubscriptionAnalyticsHandler, getSingleSubscriptionHandler } from "./controller/subscription.controller.js";
import { getAllPlansHandler, getSinglePlanHandler, createPlanHandler, updatePlanHandler, updatePlanStatusHandler } from "./controller/plan.controller.js";
import { getAllPaymentsHandler, getRevenueStatsHandler, getRevenueAnalyticsHandler } from "./controller/payment.controller.js";
import { getAllApartmentsQuerySchema, updateStatusSchema, apartmentAnalyticsQuerySchema } from "./validation/apartment.validation.js";
import { getAllSubscriptionsQuerySchema, subscriptionAnalyticsQuerySchema } from "./validation/subscription.validation.js";
import { getAllPlansQuerySchema, createPlanSchema, updatePlanSchema, updatePlanStatusSchema } from "./validation/plan.validation.js";
import { getAllPaymentsQuerySchema, revenueAnalyticsQuerySchema } from "./validation/payment.validation.js";
import express from "express"
import { protect } from "../../middlewares/authMiddleware.js";
import { requireRole } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";

const router = express.Router();

router.use(protect, requireRole("super_admin"));

router.get("/apartments", zodValidate(getAllApartmentsQuerySchema), getAllApartmentHandler);

router.get("/apartments/stats", getApartmentStatsHandler);

router.get("/apartments/analytics", zodValidate(apartmentAnalyticsQuerySchema), getApartmentAnalyticsHandler);

router.get("/apartments/:id" , getSingleApartmentHandler )

router.patch("/apartments/:id/status" , zodValidate(updateStatusSchema) , updateStatusHandler )

router.get("/subscriptions", zodValidate(getAllSubscriptionsQuerySchema), getAllSubscriptionsHandler);

router.get("/subscriptions/stats", getSubscriptionStatsHandler);

router.get("/subscriptions/analytics", zodValidate(subscriptionAnalyticsQuerySchema), getSubscriptionAnalyticsHandler);

router.get("/subscriptions/:id", getSingleSubscriptionHandler);

router.get("/subscription-plans", zodValidate(getAllPlansQuerySchema), getAllPlansHandler);

router.post("/subscription-plans", zodValidate(createPlanSchema), createPlanHandler);

router.get("/subscription-plans/:id", getSinglePlanHandler);

router.patch("/subscription-plans/:id/status", zodValidate(updatePlanStatusSchema), updatePlanStatusHandler);

router.patch("/subscription-plans/:id", zodValidate(updatePlanSchema), updatePlanHandler);

router.get("/payments", zodValidate(getAllPaymentsQuerySchema), getAllPaymentsHandler);

router.get("/payments/stats", getRevenueStatsHandler);

router.get("/payments/analytics", zodValidate(revenueAnalyticsQuerySchema), getRevenueAnalyticsHandler);

export default router