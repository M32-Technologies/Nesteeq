import { Request , Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { createApartment } from "./apartment.service.js";
import { AppError } from "../../utils/AppError.js";

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
