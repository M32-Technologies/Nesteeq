import { AppError } from "../../utils/AppError.js";
import { Apartment } from "./apartment.model.js";
import { CreateApartmentInput } from "./apartment.validation.js";

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const createApartment = async (data : CreateApartmentInput , managerId : string) => {
    const pendingApartment = await Apartment.findOne({
        managerId,
        status: "pending_payment",
    });

    if (pendingApartment) {
        throw new AppError(
            "You already have an apartment registration in progress",
            409
        );
    }
    const existingApartment = await Apartment.findOne({
        address: {
            $regex: `^${escapeRegex(data.address.trim())}$`,
            $options: "i",
        },

        city: {
            $regex: `^${escapeRegex(data.city.trim())}$`,
            $options: "i",
        },

        state: {
            $regex: `^${escapeRegex(data.state.trim())}$`,
            $options: "i",
        },

        status: "active",
    });

    if (existingApartment) {
        throw new AppError(
            "This apartment is already registered",
            409
        );
    }
    const apartment = await Apartment.create({
        ...data,
        managerId,
        status: "pending_payment",
    });

    return apartment;
}