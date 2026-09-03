import { Request, Response } from "express";

import {
  getAuditByIdService,
  getAuditLogsService,
} from "./audit.service.js";

import { AuditAction } from "./audit.interface.js";

import { catchAsync } from "../../utils/catchAsync.js";

export const getAuditLogs = catchAsync(
  async (req: Request, res: Response) => {
    const logs = await getAuditLogsService({
      apartmentId: req.query.apartmentId as string,
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

    res.status(200).json({
      success: true,
      data: audit,
    });
  }
);