import { catchAsync } from "../../utils/catchAsync.js";
import { Request, Response } from "express";
import { getResident, getResidentDetails, updateResidentDetails, updateResidentStatus } from "./resident.service.js";
import { ResidentListQuery } from "./resident.validation.js";
import { AppError } from "../../utils/AppError.js";

export const getResidentHandler = catchAsync(async (req: Request, res: Response) => {

    const apartmentId = req.user?.apartmentId!
    const query = req.query as unknown as ResidentListQuery;
    const result = await getResident(query, apartmentId);

    res.status(200).json({
        success: true,
        data: result,
    })
})

export const getResidentDetailsHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;

    if (!apartmentId) {
        throw new AppError("Apartment context is required", 400);
    }

    const result = await getResidentDetails(String(req.params.id), apartmentId);

    res.status(200).json({
        success: true,
        data: result,
    })
})

export const updateResidentStatusHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;

    if (!apartmentId) {
        throw new AppError("Apartment context is required", 400);
    }

    const result = await updateResidentStatus(
        String(req.params.id),
        apartmentId,
        req.body?.status
    );

    res.status(200).json({
        success: true,
        data: result,
    })
})

export const updateResidentDetailsHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;

    if (!apartmentId) {
        throw new AppError("Apartment context is required", 400);
    }

    const result = await updateResidentDetails(
        String(req.params.id),
        apartmentId,
        req.body
    );

    res.status(200).json({
        success: true,
        data: result,
    })
})
