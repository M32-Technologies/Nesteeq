import express from "express"
import {
  protect,
  requireRole,
} from "../../middlewares/authMiddleware.js"
import { zodValidate } from "../../middlewares/zodValidate.js"
import {
  acceptInvitationHandler,
  createResidentInviteHandler,
  createStaffInviteHandler,
  getInvitationsHandler,
  resendInvitationHandler,
  revokeInvitationHandler,
  validateInvitationHandler,
  getResidentExcelTemplate ,
  bulkCreateInvitationsHandler
} from "./invitation.controller.js"
import {
  acceptInvitationParamSchema,
  createResidentInviteSchema,
  createStaffInviteSchema,
  getInvitationsSchema,
  invitationIdParamSchema,
  validateInvitationParamSchema,
} from "./invitation.validation.js"
import { uploadInviteFile } from "../../middlewares/uplode.js"
const router = express.Router()

const managerOnly = requireRole("property_manager")
router.get("/validate/:token", zodValidate(validateInvitationParamSchema), validateInvitationHandler)

router.post("/:token/accept", protect , zodValidate(acceptInvitationParamSchema), acceptInvitationHandler)

router.post("/residents", protect, managerOnly, zodValidate(createResidentInviteSchema), createResidentInviteHandler)

router.post("/staff", protect, managerOnly, zodValidate(createStaffInviteSchema), createStaffInviteHandler)
router.get("/", protect, managerOnly, zodValidate(getInvitationsSchema), getInvitationsHandler)
router.post("/:id/resend", protect, managerOnly, zodValidate(invitationIdParamSchema), resendInvitationHandler)
router.patch("/:id/revoke", protect, managerOnly, zodValidate(invitationIdParamSchema), revokeInvitationHandler)


// excel importing means buik 

router.get("/residents/template" ,getResidentExcelTemplate)
router.post("/residents/bulk-invite" , protect , uploadInviteFile, bulkCreateInvitationsHandler  )
export default router 