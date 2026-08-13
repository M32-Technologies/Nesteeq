import { MongoClient, type Db } from "mongodb";
import { env } from "./env.js";

const client = new MongoClient(env.mongoUrl);

const db: Db = client.db();

export const connectAuthDB = async (): Promise<void> => {
  await client.connect();

  console.log("Better Auth MongoDB connected successfully");
};

export const getAuthDB = (): Db => {
  return db;
};

export const authMongoClient = client;