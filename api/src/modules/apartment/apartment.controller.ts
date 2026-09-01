import { Request , Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { createApartment, getPendingApartment } from "./apartment.service.js"

export const createApartmentHandler = catchAsync(
    async (req : Request , res : Response) =>{
        const managerId = req.user?.id!;
        const result = await createApartment(req.body , managerId)

        res.status(201).json({
            success : true,
            data : result
        })
    }
)

export const getPendingApartmentHandler = catchAsync(
    async (req : Request , res : Response) =>{
        const managerId = req.user?.id!;
        const result = await getPendingApartment(managerId)

        res.status(200).json({
            success : true,
            data : result
        })
    }
)
