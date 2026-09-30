import { Request , Response  } from "express";
import { catchAsync } from "../../../utils/catchAsync.js";
import { getAllApartment , getSingleApartment , updateStatusApartment, getApartmentStats, getApartmentAnalytics } from "../services/apartment.service.js";
import { GetAllApartmentsQuery, ApartmentAnalyticsQuery } from "../validation/apartment.validation.js";


export const getAllApartmentHandler = catchAsync(
    async(req : Request , res : Response)=>{
        const query = req.query as unknown as GetAllApartmentsQuery ; 
        const result = await getAllApartment(query)

        res.status(200).json({
            success : true ,
            data : result
        })
    }
)

export const getApartmentStatsHandler = catchAsync(
    async (req: Request, res: Response) => {
        const result = await getApartmentStats();

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);

export const getApartmentAnalyticsHandler = catchAsync(
    async (req: Request, res: Response) => {
        const query = req.query as unknown as ApartmentAnalyticsQuery;
        const result = await getApartmentAnalytics(query);

        res.status(200).json({
            success: true,
            data: result,
        });
    }
);


export const getSingleApartmentHandler = catchAsync(
    async(req : Request , res : Response)=>{
        const apartmentId = req.params.id as string ;
        
        const result = await getSingleApartment(apartmentId)  

        res.status(200).json({
            success : true ,
            data : result
        })
    }
)

export const updateStatusHandler = catchAsync(
    async(req : Request , res : Response )=>{
        
        const apartmentId = req.params.id as string
        
        const result = await updateStatusApartment(apartmentId , req.body.status)

        res.status(200).json({
            success : true , 
            data : result
        })
    }
)
