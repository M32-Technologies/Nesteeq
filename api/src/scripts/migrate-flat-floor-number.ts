import type { AnyBulkWriteOperation } from "mongodb";
import mongoose from "mongoose";

import { env } from "../config/env.js";

type FlatFloorDocument = {
  _id: unknown;
  floorNumber?: unknown;
};

const isPositiveIntegerText = (value: unknown): value is string =>
  typeof value === "string" && /^[1-9]\d*$/.test(value.trim());

const main = async () => {
  if (!env.mongoUrl) {
    throw new Error("MONGO_URL is required to run this migration");
  }

  await mongoose.connect(env.mongoUrl, {
    serverSelectionTimeoutMS: 10000,
  });

  const flats = mongoose.connection.collection<FlatFloorDocument>("flats");
  const stringFloorFlats = await flats
    .find(
      {
        floorNumber: {
          $type: "string",
        },
      },
      {
        projection: {
          floorNumber: 1,
        },
      },
    )
    .toArray();

  const invalidFlats = stringFloorFlats.filter(
    (flat) => !isPositiveIntegerText(flat.floorNumber),
  );

  if (invalidFlats.length > 0) {
    throw new Error(
      `Cannot migrate ${invalidFlats.length} flats with invalid floorNumber values`,
    );
  }

  const operations: AnyBulkWriteOperation<FlatFloorDocument>[] =
    stringFloorFlats.map((flat) => ({
      updateOne: {
        filter: {
          _id: flat._id,
        },
        update: {
          $set: {
            floorNumber: Number((flat.floorNumber as string).trim()),
          },
        },
      },
    }));

  if (operations.length > 0) {
    await flats.bulkWrite(operations, {
      ordered: true,
    });
  }

  console.log(
    `Migrated ${operations.length} flat floorNumber values to numbers`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
