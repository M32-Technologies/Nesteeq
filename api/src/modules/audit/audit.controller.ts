import { Request, Response } from "express";

import {
  getAuditByIdService,
  getAuditLogsService,
} from "./audit.service.js";

import { AuditAction } from "./audit.interface.js";

import { catchAsync } from "../../utils/catchAsync.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
} from "../../middlewares/authMiddleware.js";

export const getAuditLogs = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const logs = await getAuditLogsService({
      apartmentId: authenticatedApartmentId,
      performedBy: req.query.performedBy as string,
      action: req.query.action as AuditAction,
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  }
);

export const getAuditById = catchAsync(
  async (req: Request, res: Response) => {
    const audit = await getAuditByIdService(
      req.params.id as string
    );

    ensureApartmentAccess(req, audit.apartmentId);

    res.status(200).json({
      success: true,
      data: audit,
    });
  }
);
