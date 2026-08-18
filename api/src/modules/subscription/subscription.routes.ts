import express from "express"
import { zodValidate } from "../../middlewares/zodValidate.js"
import { CreateSubscriptionPlanHandler, GetSubscriptionPlansHandler } from "./subscription.controller.js"
import { subscriptionPlanSchema } from "./subscription.schema.js"
const router = express.Router()

router.get("/subscription-plans" , GetSubscriptionPlansHandler)
router.post("/subscription-plans" , zodValidate(subscriptionPlanSchema) , CreateSubscriptionPlanHandler)

export default router
