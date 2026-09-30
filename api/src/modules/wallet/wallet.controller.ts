import { Request, Response } from "express";

import {
  addWalletFundsService,
  createWalletService,
  deductWalletFundsService,
  getWalletService,
  getWalletsService,
  getWalletSummaryService,
} from "./wallet.service.js";

import { Billing } from "../billing/billing.model.js";

import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import {
  ensureApartmentAccess,
  getAuthenticatedApartmentId,
} from "../../middlewares/authMiddleware.js";

const getAuditActor = (req: Request) => ({
  userId: req.user!.id,
});

export const createWallet = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.body.apartmentId || getAuthenticatedApartmentId(req);
    if (req.body.apartmentId) {
      ensureApartmentAccess(req, req.body.apartmentId);
    }
    const { residentId } = req.body;

    const wallet = await createWalletService(
      apartmentId,
      residentId
    );

    res.status(201).json({
      success: true,
      message: "Wallet created successfully",
      data: wallet,
    });
  }
);

export const getWallet = catchAsync(
  async (req: Request, res: Response) => {
    const { residentId } = req.params;
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }

    const wallet = await getWalletService(
      authenticatedApartmentId,
      residentId as string
    );

    res.status(200).json({
      success: true,
      data: wallet,
    });
  }
);

export const addWalletFunds = catchAsync(
  async (req: Request, res: Response) => {
    const { residentId } = req.params;
    const apartmentId = req.body.apartmentId || getAuthenticatedApartmentId(req);
    if (req.body.apartmentId) {
      ensureApartmentAccess(req, req.body.apartmentId);
    }
    const { amount, description } = req.body;

    const wallet = await addWalletFundsService(
      apartmentId,
      residentId as string,
      amount,
      description,
      getAuditActor(req)
    );

    res.status(200).json({
      success: true,
      message: "Funds added successfully",
      data: wallet,
    });
  }
);

export const deductWalletFunds = catchAsync(
  async (req: Request, res: Response) => {
    const { residentId } = req.params;
    const apartmentId = req.body.apartmentId || getAuthenticatedApartmentId(req);
    if (req.body.apartmentId) {
      ensureApartmentAccess(req, req.body.apartmentId);
    }

    const {
      billId,
      amount,
      description,
    } = req.body;

    if (billId) {
      const bill = await Billing.findById(billId).select("apartmentId").lean();
      if (!bill) {
        throw new AppError("Bill not found", 404);
      }
      ensureApartmentAccess(req, bill.apartmentId);
    }

    const wallet = await deductWalletFundsService(
      apartmentId,
      residentId as string,
      billId,
      amount,
      description,
      getAuditActor(req)
    );

    res.status(200).json({
      success: true,
      message: "Wallet amount deducted successfully",
      data: wallet,
    });
  }
);

export const getWallets = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }
    const { search, status, page, limit } = req.query;

    const wallets = await getWalletsService(
      authenticatedApartmentId,
      {
        search: search as string | undefined,
        status: status as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }
    );

    res.status(200).json({
      success: true,
      data: wallets,
    });
  }
);

export const getWalletSummary = catchAsync(
  async (req: Request, res: Response) => {
    const authenticatedApartmentId = getAuthenticatedApartmentId(req);
    if (req.query.apartmentId) {
      ensureApartmentAccess(req, req.query.apartmentId as string);
    }
    const summary = await getWalletSummaryService(authenticatedApartmentId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  }
);
