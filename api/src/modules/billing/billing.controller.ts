import { Request, Response } from "express";

import {
  createBillService,
  createCommonBillService,
  deleteBillService,
  getBillByIdService,
  getBillRecipientsService,
  getBillingSummaryService,
  getBillsService,
  getCommonBillsService,
  getMyResidentBillsService,
  payResidentBillService,
  payAllResidentBillsService,
  recordBillPaymentService,
  updateBillService,
  waiveLateFeeService,
} from "./billing.service.js";

import { BillStatus } from "./billing.interface.js";
import { Billing } from "./billing.model.js";

import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
} from "../../middlewares/authMiddleware.js";

const getAuditActor = (req: Request) => ({
  userId: req.user!.id,
});

const checkBillAccess = async (req: Request, billId: string) => {
  const bill = await Billing.findById(billId).select("apartmentId").lean();
  if (!bill) {
    throw new AppError("Bill not found", 404);
  }
  ensureApartmentAccess(req, bill.apartmentId);
  return bill;
};

export const createBill = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.body.apartmentId || getAuthenticatedApartmentId(req);
    if (req.body.apartmentId) {
      ensureApartmentAccess(req, req.body.apartmentId);
    }

    const bill = await createBillService(
      { ...req.body, apartmentId, createdBy: req.user!.id },
      getAuditActor(req)
    );

    res.status(201).json({
      success: true,
      message: "Bill created successfully",
      data: bill,
    });
  }
);

export const createCommonBill = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId =
      req.body.apartmentId || getAuthenticatedApartmentId(req);
    if (req.body.apartmentId) {
      ensureApartmentAccess(req, req.body.apartmentId);
    }

    const result = await createCommonBillService(
      {
        ...req.body,
        apartmentId,
        createdBy: req.user!.id,
      },
      getAuditActor(req)
    );

    res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  }
);

export const getBills = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const bills = await getBillsService({
      apartmentId: authenticatedApartmentId,
      residentId: req.query.residentId as string | undefined,
      unitId: req.query.unitId as string | undefined,
      commonBillId: req.query.commonBillId as string | undefined,
      billType: req.query.billType as string | undefined,
      status: req.query.status as BillStatus | undefined,
    });

    res.status(200).json({
      success: true,
      data: bills,
    });
  }
);

export const getCommonBills = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const commonBills = await getCommonBillsService(authenticatedApartmentId, {
      billType: req.query.billType as string | undefined,
      status: req.query.status as string | undefined,
    });

    res.status(200).json({
      success: true,
      data: commonBills,
    });
  }
);

export const getBillRecipients = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }
    const recipients = await getBillRecipientsService(authenticatedApartmentId);

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

    ensureApartmentAccess(req, bill.apartmentId);

    res.status(200).json({
      success: true,
      data: bill,
    });
  }
);

export const getBillingSummary = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = (req.params.apartmentId || req.query.apartmentId || getAuthenticatedApartmentId(req)) as string;
    ensureApartmentAccess(req, apartmentId);
    const summary = await getBillingSummaryService(apartmentId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  }
);

export const updateBill = catchAsync(
  async (req: Request, res: Response) => {
    await checkBillAccess(req, req.params.id as string);
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
    await checkBillAccess(req, req.params.id as string);
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
    await checkBillAccess(req, req.params.id as string);
    const bill = await waiveLateFeeService(
      req.params.id as string,
      req.body.amount,
      getAuditActor(req),
      req.body.reason
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
      role: req.user!.role ?? "RESIDENT",
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
      role: req.user!.role ?? "RESIDENT",
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

export const payAllResidentBills = catchAsync(
  async (req: Request, res: Response) => {
    const user = {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user?.role || "resident",
      apartmentId: req.user!.apartmentId ?? null,
      flatId: req.user!.flatId ?? null,
    };

    const result = await payAllResidentBillsService(user, req.body);

    res.status(200).json(result);
  }
);

export const deleteBill = catchAsync(
  async (req: Request, res: Response) => {
    await checkBillAccess(req, req.params.id as string);
    const reason = (req.body?.reason || req.query?.reason) as string | undefined;
    const result = await deleteBillService(
      req.params.id as string,
      getAuditActor(req),
      reason
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }
);


