import fs from "fs"
import multer from "multer"
import path from "path"
import type { Request, Response, NextFunction } from "express"

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
    cb(null, `file-${uniqueSuffix}${ext}`)
  },
})

const evidenceStorage = multer.diskStorage({
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
  storage: evidenceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
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

const imageUploadMulter = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new AppError("Only image files are allowed", 400))
    }
  },
})

export const uploadImageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  imageUploadMulter.any()(req, res, (err: unknown) => {
    if (err) {
      return next(err)
    }
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.file = req.files[0]
    }
    next()
  })
}
