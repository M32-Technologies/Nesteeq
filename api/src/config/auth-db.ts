import { MongoClient, type Db } from "mongodb";
import { env } from "./env.js";

let client: MongoClient | null = null;

export const getAuthMongoClient = (): MongoClient => {
  if (!env.mongoUrl) {
    throw new Error("MONGO_URL is required to connect to Better Auth MongoDB");
  }

  client ??= new MongoClient(env.mongoUrl, {
    serverSelectionTimeoutMS: 10000,
  });

  return client;
};

export const connectAuthDB = async (): Promise<void> => {
  await getAuthMongoClient().connect();

  console.log("Better Auth MongoDB connected successfully");
};

export const getAuthDB = (): Db => {
  return getAuthMongoClient().db();
};
