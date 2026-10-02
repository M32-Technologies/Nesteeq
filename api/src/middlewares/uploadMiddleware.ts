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

const evidenceUploadMulter = multer({
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
})

export const uploadEvidenceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  evidenceUploadMulter.fields([
    { name: "file", maxCount: 1 },
    { name: "evidence", maxCount: 1 },
    { name: "receipt", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "bill", maxCount: 1 },
  ])(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_UNEXPECTED_FILE") {
        return evidenceUploadMulter.any()(req, res, (anyErr: unknown) => {
          if (anyErr) return next(anyErr)
          if (!req.file && req.files) {
            if (Array.isArray(req.files) && req.files.length > 0) {
              req.file = req.files[0]
            }
          }
          next()
        })
      }
      return next(err)
    }

    if (!req.file && req.files) {
      if (Array.isArray(req.files) && req.files.length > 0) {
        req.file =
          req.files.find((f) =>
            ["file", "evidence", "receipt", "image", "bill"].includes(
              f.fieldname.toLowerCase()
            )
          ) || req.files[0]
      } else {
        const filesObj = req.files as Record<string, Express.Multer.File[]>
        req.file =
          filesObj.file?.[0] ||
          filesObj.evidence?.[0] ||
          filesObj.receipt?.[0] ||
          filesObj.image?.[0] ||
          filesObj.bill?.[0] ||
          Object.values(filesObj).flat()[0]
      }
    }
    next()
  })
}

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
