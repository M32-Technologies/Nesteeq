import fs from "fs"
import multer from "multer"
import path from "path"

import { AppError } from "../utils/AppError.js"

const uploadDir = path.join(process.cwd(), "public", "uploads")

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `evidence-${uniqueSuffix}${ext}`)
  },
})

export const uploadEvidenceMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true)
    } else {
      cb(new AppError("Only image and PDF files are allowed as evidence", 400))
    }
  },
}).single("evidence")

const avatarUploadDir = path.join(process.cwd(), "public", "uploads", "avatars")

if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true })
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(avatarUploadDir)) {
      fs.mkdirSync(avatarUploadDir, { recursive: true })
    }
    cb(null, avatarUploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const userId = (req as { user?: { id?: string } })?.user?.id || "user"
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`)
  },
})

export const uploadAvatarMiddleware = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new AppError("Only image files (JPEG, PNG, WebP) are allowed", 400))
    }
  },
}).single("avatar")