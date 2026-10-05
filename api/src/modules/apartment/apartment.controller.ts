import { Request , Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { Apartment } from "./apartment.model.js";
import {
    createApartment,
    getCurrentApartment,
    getPendingApartment,
    updateCurrentApartment,
} from "./apartment.service.js"


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

export const getCurrentApartmentHandler = catchAsync(
    async (req : Request , res : Response) =>{
        const apartmentId = req.user?.apartmentId ?? undefined;
        const result = await getCurrentApartment(apartmentId)

        res.status(200).json({
            success : true,
            data : result
        })
    }
)

export const updateCurrentApartmentHandler = catchAsync(
    async (req : Request , res : Response) =>{
        const apartmentId = req.user?.apartmentId ?? undefined;
        const result = await updateCurrentApartment(apartmentId, req.body);

        res.status(200).json({
            success : true,
            data : result
        })
    }
)

export const getApartmentStatusHandler = catchAsync(
    async (req: Request, res: Response) => {

        let apartmentId = req.user?.apartmentId ?? undefined;

        if (!apartmentId && req.user?.role === "property_manager" && req.user?.id) {
            const apt = await Apartment.findOne({ managerId: req.user.id }).select("_id");
            if (apt) apartmentId = apt._id.toString();
        }

        if (!apartmentId) {
            return res.status(200).json({
                success: true,
                data: {
                    hasApartment: false,
                    status: null,
                    name: null,
                    inactiveReason: null,
                }
            });
        }

        const apartment = await Apartment.findById(apartmentId).select("_id name status inactiveReason");
        if (!apartment) {
            throw new AppError("Apartment not found", 404);
        }

        res.status(200).json({
            success: true,
            data: {
                hasApartment: true,
                apartmentId: apartment._id.toString(),
                name: apartment.name,
                status: apartment.status,
                inactiveReason: apartment.inactiveReason ?? null,
            }
        });
    }
);
