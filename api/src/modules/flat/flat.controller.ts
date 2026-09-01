import { catchAsync } from "../../utils/catchAsync.js";
import type { Request, Response } from "express";
import type { FlatIdParams, FlatListQuery } from "./flat.schema.js";
import {
    createFlat,
    deactivateFlat,
    generateFlats,
    getFlat,
    getFlatById,
    updateFlat,
} from "./flat.service.js";


export const generateFlatsHandler = catchAsync(
    async(req : Request , res : Response) =>{
        const apartmentId = req.user?.apartmentId!
        const result = await generateFlats(req.body, apartmentId);

        res.status(201).json({
            success: true,
            message: "Flats generated successfully",
            data: result,
        });
    }
)


export const createFlatHandler = catchAsync(
    async(req : Request , res : Response) =>{
        const apartmentId = req.user?.apartmentId!
        const result = await createFlat(req.body, apartmentId);

        res.status(201).json({
            success: true,
            data: {
                flat: result,
            },
        });
    }
)

export const getFlatHandler = catchAsync(
    async(req : Request , res : Response) =>{
        const apartmentId = req.user?.apartmentId!
        const query = req.query as unknown as FlatListQuery;
        const result = await getFlat(query, apartmentId);

        res.status(200).json({
            success: true,
            data: result,
        });
    }
)

export const getFlatByIdHandler = catchAsync(
    async(req : Request , res : Response) =>{
        const apartmentId = req.user?.apartmentId!
        const params = req.params as unknown as FlatIdParams;
        const result = await getFlatById(params.id, apartmentId);

        res.status(200).json({
            success: true,
            data: {
                flat: result,
            },
        });
    }
)

export const updateFlatHandler = catchAsync(
    async(req : Request , res : Response) =>{
        const apartmentId = req.user?.apartmentId!
        const params = req.params as unknown as FlatIdParams;
        const result = await updateFlat(params.id, req.body, apartmentId);

        res.status(200).json({
            success: true,
            data: {
                flat: result,
            },
        });
    }
)

export const deactivateFlatHandler = catchAsync(
    async(req : Request , res : Response) =>{
        const apartmentId = req.user?.apartmentId!
        const params = req.params as unknown as FlatIdParams;
        const result = await deactivateFlat(params.id, apartmentId);

        res.status(200).json({
            success: true,
            message: "Flat deactivated successfully",
            data: {
                flat: result,
            },
        });
    }
)
