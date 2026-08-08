import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUrl);
    console.log("MongoDB connected successfully");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("MongoDB Connection Failed:", errorMessage);
    process.exit(1);
  }
}
