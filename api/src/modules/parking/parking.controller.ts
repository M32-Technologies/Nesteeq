import type { Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync.js"
import { generateParkingSlots, getParkingSlots, getParkingSlotById, updateParkingSlot, assignResidentParking, releaseResidentParking, updateParkingSlotStatus } from "./parking.service.js"
import type { GetParkingSlotsQuery, ParkingIdParams, UpdateParkingSlotInput, AssignResidentParkingInput, UpdateParkingSlotStatusInput } from "./parking.validation.js"


export const generateParkingSlotsHandler = catchAsync(
    async (req: Request, res: Response) => {
        const apartmentId = req.user?.apartmentId!;
        const result = await generateParkingSlots(apartmentId, req.body);

        res.status(201).json({
            success: true,
            message: "Parking slots generated successfully",
            data: result,
        });
    }
)

export const getParkingSlotsHandler = catchAsync(
    async (req: Request, res: Response) => {
        const apartmentId = req.user?.apartmentId!;
        const query = req.query as unknown as GetParkingSlotsQuery;
        const result = await getParkingSlots(query, apartmentId);

        res.status(200).json({
            success: true,
            data: result,
        });
    }
)

export const getParkingSlotByIdHandler = catchAsync(
    async (req: Request, res: Response) => {
        const apartmentId = req.user?.apartmentId!;
        const { parkingId } = req.params as unknown as ParkingIdParams;
        const parkingSlot = await getParkingSlotById(parkingId, apartmentId);

        res.status(200).json({
            success: true,
            data: parkingSlot,
        });
    }
)

export const updateParkingSlotHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const { parkingId } = req.params as unknown as ParkingIdParams;
    const data = req.body as UpdateParkingSlotInput;
    const result = await updateParkingSlot(parkingId, data, apartmentId);

    res.status(200).json({
      success: true,
      message: "Parking slot updated successfully",
      data: result,
    });
  }
);

export const assignResidentParkingHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const { parkingId } = req.params as unknown as ParkingIdParams;
    const data = req.body as AssignResidentParkingInput;
    const result = await assignResidentParking(parkingId, data, apartmentId);

    res.status(200).json({
      success: true,
      message: "Parking slot assigned successfully",
      data: result,
    });
  }
);

export const releaseResidentParkingHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const { parkingId } = req.params as unknown as ParkingIdParams;
    const result = await releaseResidentParking(parkingId, apartmentId);

    res.status(200).json({
      success: true,
      message: "Parking slot released successfully",
      data: result,
    });
  }
);

export const updateParkingSlotStatusHandler = catchAsync(
  async (req: Request, res: Response) => {
    const apartmentId = req.user?.apartmentId!;
    const { parkingId } = req.params as unknown as ParkingIdParams;
    const { status } = req.body as UpdateParkingSlotStatusInput;
    const result = await updateParkingSlotStatus(parkingId, status, apartmentId);

    const message =
      status === "INACTIVE"
        ? "Parking slot deactivated successfully"
        : "Parking slot activated successfully";

    res.status(200).json({
      success: true,
      message,
      data: result,
    });
  }
);



