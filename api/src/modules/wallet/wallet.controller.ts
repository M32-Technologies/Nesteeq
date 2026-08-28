import { Request, Response } from "express";

import {
  addWalletFundsService,
  createWalletService,
  deductWalletFundsService,
  getWalletService,
  getWalletsService,
} from "./wallet.service.js";

import { catchAsync } from "../../utils/catchAsync.js";

const getAuditActor = (req: Request) => ({
  userId: req.user!.id,
});

export const createWallet = catchAsync(
  async (req: Request, res: Response) => {
    const { apartmentId, residentId } = req.body;

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
    const { apartmentId } = req.query;

    const wallet = await getWalletService(
      apartmentId as string,
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
    const { apartmentId, amount, description } = req.body;

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

    const {
      apartmentId,
      billId,
      amount,
      description,
    } = req.body;

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
    const { apartmentId } = req.query;

    const wallets = await getWalletsService(
      apartmentId as string
    );

    res.status(200).json({
      success: true,
      data: wallets,
    });
  }
);
