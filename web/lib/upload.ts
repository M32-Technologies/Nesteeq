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

/**
 * Uploads a complaint image directly to AWS S3 using a presigned PUT URL.
 * Returns the direct S3 URL to attach to the complaint record.
 */
export async function uploadComplaintImageToS3(
  file: File,
  apartmentId?: string
): Promise<string> {
  let contentType = (file.type || "image/jpeg").toLowerCase();
  if (contentType === "image/jpg") contentType = "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    contentType = "image/jpeg";
  }

  let fileName = file.name || `complaint-${Date.now()}.jpg`;
  const ext = fileName.split(".").pop()?.toLowerCase();
  const validExts: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  };

  const allowedExts = validExts[contentType] || ["jpg", "jpeg"];
  if (!ext || !allowedExts.includes(ext)) {
    fileName = `${fileName.replace(/\.[^/.]+$/, "")}.${allowedExts[0]}`;
  }

  const payload: {
    purpose: "complaint";
    fileName: string;
    contentType: string;
    fileSize: number;
    apartmentId?: string;
  } = {
    purpose: "complaint",
    fileName,
    contentType,
    fileSize: file.size,
  };

  if (apartmentId && /^[a-fA-F0-9]{24}$/.test(apartmentId)) {
    payload.apartmentId = apartmentId;
  }

  const { data: res } = await api.post<{
    success: boolean;
    data: {
      uploadUrl: string;
      key: string;
      expiresIn: number;
    };
  }>("/api/v1/uploads/presigned-url", payload);

  const responseData = res?.data || (res as any);
  const { uploadUrl, key } = responseData;

  if (!uploadUrl) {
    throw new Error("Failed to obtain presigned upload URL from server");
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload image to AWS S3: ${uploadRes.statusText}`);
  }

  return key;
}
