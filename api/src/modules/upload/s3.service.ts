import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, s3BucketName } from "../../config/s3.js";
import { AppError } from "../../utils/AppError.js";
import {
  DEFAULT_UPLOAD_EXPIRY_SECONDS,
  DEFAULT_READ_EXPIRY_SECONDS,
} from "./upload.types.js";

export class S3Service {
  private static ensureBucketConfigured(): string {
    if (!s3BucketName) {
      throw new AppError("AWS S3 bucket name is not configured on the server", 500);
    }
    return s3BucketName;
  }

  /**
   * Generates a presigned PUT URL for direct client-to-S3 uploads.
   */
  static async generatePresignedPutUrl(
    key: string,
    contentType: string,
    expiresIn = DEFAULT_UPLOAD_EXPIRY_SECONDS,
  ): Promise<string> {
    const bucket = this.ensureBucketConfigured();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    try {
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      throw new AppError(
        `Failed to generate upload URL: ${error instanceof Error ? error.message : "Unknown S3 error"}`,
        500,
      );
    }
  }

  /**
   * Generates a temporary presigned GET URL to view a private S3 object.
   */
  static async generatePresignedGetUrl(
    key: string,
    expiresIn = DEFAULT_READ_EXPIRY_SECONDS,
  ): Promise<string> {
    const bucket = this.ensureBucketConfigured();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      throw new AppError(
        `Failed to generate access URL: ${error instanceof Error ? error.message : "Unknown S3 error"}`,
        500,
      );
    }
  }

  /**
   * Deletes a single object from S3.
   */
  static async deleteObject(key: string): Promise<void> {
    const bucket = this.ensureBucketConfigured();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      console.error(`[S3Service] Failed to delete object "${key}":`, error);
      throw new AppError("Failed to delete object from S3", 500);
    }
  }

  /**
   * Deletes multiple objects from S3 in batches.
   */
  static async deleteObjects(keys: string[]): Promise<void> {
    if (!keys.length) return;
    const bucket = this.ensureBucketConfigured();

    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      console.error(`[S3Service] Failed to delete objects:`, error);
      throw new AppError("Failed to delete objects from S3", 500);
    }
  }
}
