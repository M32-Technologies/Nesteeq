import multer from "multer"
import path from "path"

import { AppError } from "../utils/AppError.js"

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export const uploadInviteFile = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 1,
  },

  fileFilter: (_req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase()

    const isXlsx =
      extension === ".xlsx" &&
      file.mimetype === XLSX_MIME_TYPE

    if (!isXlsx) {
      return cb(
        new AppError(
          "Only .xlsx Excel files are allowed",
          400,
        ),
      )
    }

    cb(null, true)
  },
}).single("file")