import dotenv from "dotenv";
dotenv.config();

const mongoUrl = (process.env.MONGO_URL || "").trim();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number((process.env.PORT ?? "6000").trim()),
  mongoUrl,
};
