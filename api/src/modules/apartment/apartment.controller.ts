import { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync.js";

import {
  createApartmentService,
  addBlocksService,
  addFlatsService,
  getApartmentService,
} from "./apartment.service.js";

export const createApartment = catchAsync(async (
  req: Request,
  res: Response
) => {
  const apartment = await createApartmentService(req.body);

  res.status(201).json({
    success: true,
    message: "Apartment created successfully",
    data: apartment,
    apartment,
  });
});

export const addBlocks = catchAsync(async (
  req: Request,
  res: Response
) => {
  const apartmentId = req.params.id as string;

  const apartment = await addBlocksService(
    apartmentId,
    req.body.blocks
  );

  res.status(200).json({
    success: true,
    message: "Blocks added successfully",
    apartment,
  });
});

export const addFlats = catchAsync(async (
  req: Request,
  res: Response
) => {
  const apartmentId = req.params.id as string;

  const apartment = await addFlatsService(
    apartmentId,
    req.body.blocks
  );

  res.status(200).json({
    success: true,
    message: "Flats added successfully",
    apartment,
  });
});

export const getApartment = catchAsync(async (
  req: Request,
  res: Response
) => {
  const apartmentId = req.params.id as string;

  const apartment = await getApartmentService(
    apartmentId
  );

  res.status(200).json({
    success: true,
    apartment,
  });
});
