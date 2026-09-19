import { getAllApartmentHandler, getApartmentStatsHandler, getApartmentAnalyticsHandler, getSingleApartmentHandler, updateStatusHandler } from "./controller/apartment.controller.js";
import { getAllSubscriptionsHandler, getSubscriptionStatsHandler, getSubscriptionAnalyticsHandler, getSingleSubscriptionHandler } from "./controller/subscription.controller.js";
import { getAllApartmentsQuerySchema, updateStatusSchema, apartmentAnalyticsQuerySchema } from "./validation/apartment.validation.js";
import { getAllSubscriptionsQuerySchema, subscriptionAnalyticsQuerySchema } from "./validation/subscription.validation.js";
import express from "express"
import { protect } from "../../middlewares/authMiddleware.js";
import { requireRole } from "../../middlewares/authMiddleware.js";
import { zodValidate } from "../../middlewares/zodValidate.js";
// import { getSingleApartmentSchema } from "./validation/apartment.validation.js";
const router = express.Router();

router.use(protect, requireRole("super_admin"));

// apartment 

router.get("/apartments", zodValidate(getAllApartmentsQuerySchema), getAllApartmentHandler);

router.get("/apartments/stats", getApartmentStatsHandler);

router.get("/apartments/analytics", zodValidate(apartmentAnalyticsQuerySchema), getApartmentAnalyticsHandler);

router.get("/apartments/:id" , getSingleApartmentHandler )

router.patch("/apartments/:id/status" , zodValidate(updateStatusSchema) , updateStatusHandler )

// subscriptions

router.get("/subscriptions", zodValidate(getAllSubscriptionsQuerySchema), getAllSubscriptionsHandler);

router.get("/subscriptions/stats", getSubscriptionStatsHandler);

router.get("/subscriptions/analytics", zodValidate(subscriptionAnalyticsQuerySchema), getSubscriptionAnalyticsHandler);

router.get("/subscriptions/:id", getSingleSubscriptionHandler);

export default router
