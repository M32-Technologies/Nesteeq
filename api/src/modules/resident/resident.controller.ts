import { catchAsync } from "../../utils/catchAsync.js";
import { Request, Response } from "express";
import {
    getResident,
    getResidentDetails,
    getResidentStats,
    updateResidentDetails,
    updateResidentStatus,
    getMyVehiclesAndParkingService,
    registerVehicleService,
    deleteVehicleService,
    createResidentGuestPassService,
    getResidentGuestPassesService,
    cancelResidentGuestPassService,
    getCurrentResidentProfileService,
    getResidentDashboardFeedService,
} from "./resident.service.js";
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

export const getResidentStatsHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId;

    if (!apartmentId) {
        throw new AppError("Apartment context is required", 400);
    }

    const stats = await getResidentStats(apartmentId);

    res.status(200).json({
        success: true,
        data: stats,
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

export const getMyVehiclesAndParkingHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId || undefined;
    const result = await getMyVehiclesAndParkingService(req.user, apartmentId);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const registerVehicleHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId || undefined;
    const result = await registerVehicleService(req.user, req.body, apartmentId);

    res.status(201).json({
        success: true,
        data: result,
        message: "Vehicle registered successfully",
    });
});

export const deleteVehicleHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId || undefined;
    const vehicleId = String(req.params.vehicleId);
    const result = await deleteVehicleService(req.user, vehicleId, apartmentId);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const createResidentGuestPassHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId || undefined;
    const result = await createResidentGuestPassService(req.user, req.body, apartmentId);

    res.status(201).json({
        success: true,
        data: result,
        message: "Visitor pass created successfully",
    });
});

export const getResidentGuestPassesHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId || undefined;
    const result = await getResidentGuestPassesService(req.user, req.query as any, apartmentId);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const cancelResidentGuestPassHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId || undefined;
    const passId = String(req.params.passId);
    const result = await cancelResidentGuestPassService(req.user, passId, apartmentId);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const getCurrentResidentProfileHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId || undefined;
    const result = await getCurrentResidentProfileService(req.user, apartmentId);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const getResidentDashboardFeedHandler = catchAsync(async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId || undefined;
    const result = await getResidentDashboardFeedService(req.user, apartmentId);

    res.status(200).json({
        success: true,
        data: result,
    });
});

