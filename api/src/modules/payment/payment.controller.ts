import { Request, Response } from "express";

import {
  exportPaymentsCsvService,
  getPaymentsService,
  reversePaymentService,
} from "./payment.service.js";
import { PaymentSource } from "./payment.interface.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
} from "../../middlewares/authMiddleware.js";

export const getPayments = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const payments = await getPaymentsService({
      apartmentId: authenticatedApartmentId,
      billId: req.query.billId as string | undefined,
      residentId: req.query.residentId as string | undefined,
      source: req.query.source as PaymentSource | undefined,
      paymentMethod: req.query.paymentMethod as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      includeReversed: req.query.includeReversed === "true",
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      userRole: (req as any).user?.role,
    });

    res.status(200).json({
      success: true,
      data: payments,
    });
  }
);

export const exportPaymentsCsv = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const { csvContent, filename } = await exportPaymentsCsvService({
      apartmentId: authenticatedApartmentId,
      billId: req.query.billId as string | undefined,
      residentId: req.query.residentId as string | undefined,
      source: req.query.source as PaymentSource | undefined,
      paymentMethod: req.query.paymentMethod as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
      includeReversed: req.query.includeReversed === "true",
      limit: 10000,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  }
);

export const reversePayment = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = getAuthenticatedApartmentId(req);
    const paymentId = req.params.id as string;
    const reason = (req.body?.reason as string) || "Payment reversed by Treasurer";

    const payment = await reversePaymentService(
      paymentId,
      apartmentId,
      {
        userId: req.user?.id,
        role: req.user?.role ?? undefined,
      },
      reason
    );

    res.status(200).json({
      success: true,
      message: "Payment successfully reversed",
      data: payment,
    });
  }
);