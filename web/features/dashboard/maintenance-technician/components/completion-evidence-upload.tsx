"use client"

import { useRef, useState } from "react"
import {
  Camera,
  CheckCircle2,
  FileCheck,
  ImageIcon,
  Paperclip,
  Trash2,
  UploadCloud,
} from "lucide-react"

import {
  uploadEvidence,
  type UploadEvidenceResponse,
} from "../services/jobs.service"

type CompletionEvidenceUploadProps = {
  jobId: string
  onUploadSuccess?: (evidence: UploadEvidenceResponse) => void
}

export default function CompletionEvidenceUpload({
  jobId,
  onUploadSuccess,
}: CompletionEvidenceUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedEvidence, setUploadedEvidence] = useState<
    UploadEvidenceResponse[]
  >([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size exceeds 10MB limit.")
      return
    }

    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleClearSelected = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      setIsUploading(true)
      setErrorMessage(null)

      const formData = new FormData()
      formData.append("evidence", selectedFile)

      const result = await uploadEvidence(jobId, formData)
      setUploadedEvidence((prev) => [result, ...prev])
      setSuccessMessage(`"${result.fileName}" uploaded successfully!`)
      onUploadSuccess?.(result)
      handleClearSelected()
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to upload evidence file."
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E7F4EE] text-[#0F5F45]">
          <Camera size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Work / Completion Evidence Upload
          </h3>
          <p className="text-xs text-slate-500">
            Upload on-site photos, repair receipts, or completion proof.
          </p>
        </div>
      </div>

      {/* Hidden File Input with Camera & Gallery Support */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drop / Select Zone */}
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center cursor-pointer transition hover:border-[#0F5F45]/50 hover:bg-[#E7F4EE]/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-[#E7F4EE] group-hover:text-[#0F5F45]">
            <UploadCloud size={24} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Click to take photo or choose file
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Supports camera capture, JPG, PNG, WEBP, or PDF up to 10MB
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-xs text-slate-700">
                {selectedFile.type.startsWith("image/") ? (
                  <ImageIcon size={18} />
                ) : (
                  <Paperclip size={18} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isUploading}
              onClick={handleClearSelected}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-red-600 transition"
              title="Remove file"
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* Thumbnail preview if image */}
          {previewUrl && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={previewUrl}
                alt="Selected evidence preview"
                className="max-h-56 w-full object-contain bg-slate-950/5"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleClearSelected}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUploading}
              onClick={handleUpload}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F5F45] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0c4e38] transition disabled:opacity-50"
            >
              <UploadCloud size={14} />
              {isUploading ? "Uploading..." : "Upload Evidence"}
            </button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <p className="text-xs font-medium text-red-600">{errorMessage}</p>
      )}

      {/* Success alert */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* List of uploaded files in current session */}
      {uploadedEvidence.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Uploaded in this session ({uploadedEvidence.length})
          </p>
          <div className="space-y-2">
            {uploadedEvidence.map((ev, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-700"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCheck size={14} className="shrink-0 text-emerald-600" />
                  <span className="truncate font-medium">{ev.fileName}</span>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-slate-400">
                  Ready
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}