import api from "@/lib/axios";

/**
 * Uploads an avatar image directly to AWS S3 using a presigned PUT URL.
 * Returns the permanent S3 key (e.g. users/{userId}/avatar/{uuid}.jpg) to save in the user profile.
 */
export async function uploadAvatarToS3(file: File): Promise<string> {
  const { data: res } = await api.post("/api/v1/uploads/presigned-url", {
    purpose: "avatar",
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });

  const { uploadUrl, key } = res.data;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload image to storage");
  }

  return key;
}
