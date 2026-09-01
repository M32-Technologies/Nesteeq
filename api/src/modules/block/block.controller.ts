import { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync.js";
import {
  createBlock,
  deleteBlock,
  getBlocks,
  getSingleBlock,
  updateBlock,
} from "./block.service.js";
import { BlockListQuery } from "./block.schema.js";

export const createBlockHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const result = await createBlock(req.body, apartmentId);

    res.status(201).json({
      success: true,
      data: {
        block: result,
      },
    });
  },
);

export const getBlocksHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const query = req.query as unknown as BlockListQuery;
    const result = await getBlocks(query, apartmentId);

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);

export const getSingleBlockHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const blockId = String(req.params.id);
    const result = await getSingleBlock(apartmentId, blockId);

    res.status(200).json({
      success: true,
      data: {
        block: result,
      },
    });
  },
);

export const updateBlockHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const blockId = String(req.params.id);
    const result = await updateBlock(req.body, apartmentId, blockId);

    res.status(200).json({
      success: true,
      data: {
        block: result,
      },
    });
  },
);

export const deleteBlockHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const blockId = String(req.params.id);
    const result = await deleteBlock(apartmentId, blockId);

    res.status(200).json({
      success: true,
      message: "Block deactivated successfully",
      data: {
        block: result,
      },
    });
  },
);
