import { Request, Response } from "express";

import { getPaymentsService } from "./payment.service.js";
import { PaymentSource } from "./payment.interface.js";
import { catchAsync } from "../../utils/catchAsync.js";

export const getPayments = catchAsync(
  async (req: Request, res: Response) => {
    const payments = await getPaymentsService({
      apartmentId: req.query.apartmentId as string,
      billId: req.query.billId as string | undefined,
      residentId: req.query.residentId as string | undefined,
      source: req.query.source as PaymentSource | undefined,
      limit: req.query.limit
        ? Number(req.query.limit)
        : undefined,
    });

    res.status(200).json({
      success: true,
      data: payments,
    });
  }
);