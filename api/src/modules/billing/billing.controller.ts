import { Request, Response } from "express";

import {
  createBillService,
  getBillByIdService,
  getBillRecipientsService,
  getBillingSummaryService,
  getBillsService,
  getMyResidentBillsService,
  payResidentBillService,
  recordBillPaymentService,
  updateBillService,
  waiveLateFeeService,
} from "./billing.service.js";

import { BillStatus } from "./billing.interface.js";

import { catchAsync } from "../../utils/catchAsync.js";
import { getAuthenticatedApartmentId } from "../../middlewares/authMiddleware.js";

const getAuditActor = (req: Request) => ({
  userId: req.user!.id,
});

export const createBill = catchAsync(
  async (req: Request, res: Response) => {
    const bill = await createBillService(
      { ...req.body, createdBy: req.user!.id },
      getAuditActor(req)
    );

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      data: bill,
    });
  }
);

export const getBills = catchAsync(
  async (req: Request, res: Response) => {
    const bills = await getBillsService({
      apartmentId: req.query.apartmentId as string | undefined,
      residentId: req.query.residentId as string | undefined,
      unitId: req.query.unitId as string | undefined,
      status: req.query.status as BillStatus | undefined,
    });

    res.status(200).json({
      success: true,
      data: bills,
    });
  }
);

export const getBillRecipients = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId =
      (req.query.apartmentId as string) || getAuthenticatedApartmentId(req);
    const recipients = await getBillRecipientsService(apartmentId);

    res.status(200).json({
      success: true,
      data: recipients,
    });
  }
);

export const getBillById = catchAsync(
  async (req: Request, res: Response) => {
    const bill = await getBillByIdService(
      req.params.id as string
    );

    res.status(200).json({
      success: true,
      data: bill,
    });
  }
);

export const getBillingSummary = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = (req.params.apartmentId || req.query.apartmentId || req.user?.apartmentId) as string;
    const summary = await getBillingSummaryService(apartmentId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  }
);

export const updateBill = catchAsync(
  async (req: Request, res: Response) => {
    const bill = await updateBillService(
      req.params.id as string,
      req.body,
      getAuditActor(req)
    );

    res.status(200).json({
      success: true,
      message: "Bill updated successfully",
      data: bill,
    });
  }
);

export const recordBillPayment = catchAsync(
  async (req: Request, res: Response) => {
    const bill = await recordBillPaymentService(
      req.params.id as string,
      req.body.amount,
      getAuditActor(req),
      {
        paymentMethod: req.body.paymentMethod,
        referenceNo: req.body.referenceNo,
        description: req.body.description,
      }
    );

    res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      data: bill,
    });
  }
);

export const waiveLateFee = catchAsync(
  async (req: Request, res: Response) => {
    const bill = await waiveLateFeeService(
      req.params.id as string,
      req.body.amount,
      getAuditActor(req)
    );

    res.status(200).json({
      success: true,
      message: "Late fee waived successfully",
      data: bill,
    });
  }
);

export const getMyResidentBills = catchAsync(
  async (req: Request, res: Response) => {
    const user = {
      id: req.user!.id,
      role: req.user!.role,
      apartmentId: req.user!.apartmentId ?? null,
      flatId: req.user!.flatId ?? null,
    };

    const data = await getMyResidentBillsService(user);

    res.status(200).json({
      success: true,
      data,
    });
  }
);

export const payResidentBill = catchAsync(
  async (req: Request, res: Response) => {
    const user = {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      apartmentId: req.user!.apartmentId ?? null,
      flatId: req.user!.flatId ?? null,
    };

    const result = await payResidentBillService(
      req.params.id as string,
      user,
      req.body
    );

    res.status(200).json(result);
  }
);

