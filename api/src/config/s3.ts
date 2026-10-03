import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export const s3BucketName = env.awsS3BucketName;

export const s3Client = new S3Client({
  region: env.awsRegion || "ap-south-1",
  credentials: {
    accessKeyId: env.awsAccessKeyId,
    secretAccessKey: env.awsSecretAccessKey,
  },
});