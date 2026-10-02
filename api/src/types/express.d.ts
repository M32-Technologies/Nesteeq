import { auth } from "../lib/auth.js";

type Session = typeof auth.$Infer.Session;

export interface AuthUser {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    role?: string | null;
    phone?: string | null;
    apartmentId?: string | null;
    flatId?: string | null;
    apartmentStatus?: string | null;
    inactiveReason?: string | null;
    apartmentName?: string | null;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            session?: Session["session"];
        }
    }
}