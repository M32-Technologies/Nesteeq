import { AppError } from "../../utils/AppError.js";
import { getAuthDB } from "../../config/auth-db.js";
import { Apartment } from "./apartment.model.js";
import { CreateApartmentInput } from "./apartment.validation.js";
import { ObjectId } from "mongodb";

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getAuthUserFilter = (userId: string) => {
    const filters: Record<string, unknown>[] = [{ id: userId }];

    if (ObjectId.isValid(userId)) {
        filters.push({ _id: new ObjectId(userId) });
    }

    return { $or: filters };
};

export const createApartment = async (data : CreateApartmentInput , managerId : string) => {
    const authUser = await getAuthDB()
        .collection("user")
        .findOne(getAuthUserFilter(managerId), { projection: { _id: 1 } });

    if (!authUser) {
        throw new AppError("Authenticated user was not found", 404);
    }

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

    const userUpdate = await getAuthDB()
        .collection("user")
        .updateOne(
            getAuthUserFilter(managerId),
            {
                $set: {
                    apartmentId: apartment._id.toString(),
                },
            }
        );
    
    if (userUpdate.matchedCount === 0) {
        throw new AppError("Unable to attach apartment to user account", 500);
    }

    return apartment;
}

export const getPendingApartment = async (managerId: string) => {
    return Apartment.findOne({
        managerId,
        status: "pending_payment",
    });
}

