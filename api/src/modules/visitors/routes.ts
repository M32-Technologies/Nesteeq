import { Router } from "express"

import passRoutes from "./pass/pass.routes.js"
import visitRoutes from "./visit/visit.routes.js"

const router = Router()

router.use("/passes", passRoutes)
router.use("/visits", visitRoutes)

export default router