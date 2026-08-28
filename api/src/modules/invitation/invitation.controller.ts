import { Request, Response } from "express"

import { catchAsync } from "../../utils/catchAsync.js"
import { AppError } from "../../utils/AppError.js"

import {
  acceptInvitation,
  createResidentInvite,
  createStaffInvite,
  getInvitations,
  resendInvitation,
  revokeInvitation,
  validateInvitation,
  bulkCreateResidentInvites
} from "./invitation.service.js"

import type { GetInvitationsQuery } from "./invitation.validation.js"
import { generateResidentExcelTemplate } from "../../utils/excel/user.template.js"

export const createResidentInviteHandler = catchAsync(
  async (req: Request, res: Response) => {


    const user = req.user!
    if (!user.apartmentId) {
      throw new AppError(
        "Apartment context is required",
        400
      )
    }
    const result = await createResidentInvite(req.body, user.apartmentId, user.id, user.role)

    res.status(201).json({
      success: true,
      data: result,
    })
  }
)

export const createStaffInviteHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!

    if (!user.apartmentId) {
      throw new AppError(
        "Apartment context is required",
        400
      )
    }

    const result =
      await createStaffInvite(
        req.body,
        user.apartmentId,
        user.id,
        user.role
      )

    res.status(201).json({
      success: true,
      data: result,
    })
  }
)

export const getInvitationsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!

    if (!user.apartmentId) {
      throw new AppError(
        "Apartment context is required",
        400
      )
    }

    const result =
      await getInvitations(
        req.query as unknown as GetInvitationsQuery,
        user.apartmentId,
        user.role
      )

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)

export const validateInvitationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const token = String(req.params.token)

    const result =
      await validateInvitation(token)

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)

export const acceptInvitationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!

    if (!user.email) {
      throw new AppError(
        "Authenticated email is required",
        400
      )
    }

    const result =
      await acceptInvitation(
        String(req.params.token),
        {
          id: user.id,
          email: user.email,
          emailVerified:
            user.emailVerified,
        }
      )

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)

export const resendInvitationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!

    if (!user.apartmentId) {
      throw new AppError(
        "Apartment  is required",
        400
      )
    }

    const result =
      await resendInvitation(
        String(req.params.id),
        user.apartmentId,
        user.role
      )

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)

export const revokeInvitationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user!

    if (!user.apartmentId) {
      throw new AppError(
        "Apartment is required",
        400
      )
    }

    const result =
      await revokeInvitation(
        String(req.params.id),
        user.apartmentId,
        user.role
      )

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)


export const getResidentExcelTemplate = catchAsync(
  async (req: Request, res: Response) => {
    const workbook = await generateResidentExcelTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="resident-invite-template.xlsx"'
    )

    await workbook.xlsx.write(res)
  }
)

export const bulkCreateInvitationsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!
    const invitedId = req.user?.id!
    if (!req.file) {
      throw new AppError("A file is required", 400)
    }
    const result = await bulkCreateResidentInvites(req.file?.buffer, apartmentId, invitedId)

    res.status(200).json({ success: true, data: result })
  }
)