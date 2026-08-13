import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async (): Promise<void> => {
  if (!env.mongoUrl) {
    console.error("MONGO_URL is required to connect to MongoDB");
    process.exit(1);
  }

  try {
    await mongoose.connect(env.mongoUrl);
    console.log("MongoDB connected successfully");
    console.log(`Database name: ${mongoose.connection.name}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB connection error";

    console.error("MongoDB connection failed:", message);
    process.exit(1);
  }
}
