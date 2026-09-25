"use client"

import { useEffect, useRef, useState } from "react"
import {
  BrowserQRCodeReader,
  type IScannerControls,
} from "@zxing/browser"
import {
  Camera,
  CameraOff,
  CheckCircle2,
  LogIn,
  QrCode,
  X,
} from "lucide-react"

import type { VisitorPass } from "../schemas/visitor"
import {
  inputClassName,
  outlineButtonClassName,
  panelClassName,
  primaryButtonClassName,
} from "./SecurityUi"

const SCAN_TIMEOUT_MS = 15000

export function VisitorScanPanel({
  token,
  verifiedPass,
  isCheckingIn,
  isVerifying,
  onCheckIn,
  onScan,
  onTokenChange,
  onVerify,
}: {
  token: string
  verifiedPass: VisitorPass | null
  isCheckingIn: boolean
  isVerifying: boolean
  onCheckIn: () => void
  onScan: (value: string) => boolean | Promise<boolean>
  onTokenChange: (value: string) => void
  onVerify: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scannerRunIdRef = useRef(0)
  const hasScannedRef = useRef(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [scannerMessage, setScannerMessage] = useState<string | null>(null)

  const clearScanTimeout = () => {
    if (!scanTimeoutRef.current) return

    clearTimeout(scanTimeoutRef.current)
    scanTimeoutRef.current = null
  }

  const stopPreviewStream = () => {
    const videoElement = videoRef.current
    const stream = videoElement?.srcObject

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    if (videoElement) {
      videoElement.srcObject = null
    }
  }

  const stopScanner = () => {
    scannerRunIdRef.current += 1
    clearScanTimeout()
    controlsRef.current?.stop()
    controlsRef.current = null
    stopPreviewStream()
    setIsScanning(false)
    setScannerError(null)
    setScannerMessage(null)
  }

  const openScanner = async (runId: number) => {
    if (scannerRunIdRef.current !== runId) return

    const videoElement = videoRef.current

    if (!videoElement) {
      setIsScanning(false)
      setScannerError("Camera preview is not ready.")
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsScanning(false)
      setScannerError("Camera is not available in this browser.")
      return
    }

    hasScannedRef.current = false
    setScannerMessage("Scanning...")
    clearScanTimeout()
    scanTimeoutRef.current = setTimeout(() => {
      if (
        scannerRunIdRef.current !== runId ||
        hasScannedRef.current
      ) {
        return
      }

      scannerRunIdRef.current += 1
      scanTimeoutRef.current = null
      controlsRef.current?.stop()
      controlsRef.current = null
      stopPreviewStream()
      setIsScanning(false)
      setScannerMessage(null)
      setScannerError("No readable QR code found.")
    }, SCAN_TIMEOUT_MS)

    try {
      const reader = new BrowserQRCodeReader()
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
        },
        videoElement,
        async (result, _error, controls) => {
          const scannedToken = result?.getText().trim()

          if (
            !scannedToken ||
            hasScannedRef.current ||
            scannerRunIdRef.current !== runId
          ) {
            return
          }

          hasScannedRef.current = true
          clearScanTimeout()
          controls.stop()
          controlsRef.current = null
          stopPreviewStream()
          setIsScanning(false)
          setScannerError(null)
          setScannerMessage("QR detected. Verifying pass...")

          const verified = await onScan(scannedToken)

          if (verified) {
            setScannerMessage("Guest pass verified.")
            return
          }

          setScannerMessage(null)
          setScannerError("QR scanned, but the pass is not valid.")
        }
      )

      if (scannerRunIdRef.current !== runId) {
        controls.stop()
        return
      }

      controlsRef.current = controls
    } catch {
      if (scannerRunIdRef.current !== runId) return

      clearScanTimeout()
      stopPreviewStream()
      setIsScanning(false)
      setScannerMessage(null)
      setScannerError("Unable to open camera for QR scan.")
    }
  }

  const startScanner = () => {
    if (isScanning) return

    const runId = scannerRunIdRef.current + 1

    scannerRunIdRef.current = runId
    setScannerError(null)
    setScannerMessage("Starting camera...")
    setIsScanning(true)

    setTimeout(() => {
      void openScanner(runId)
    }, 0)
  }

  useEffect(() => {
    return () => {
      scannerRunIdRef.current += 1
      clearScanTimeout()
      controlsRef.current?.stop()
      stopPreviewStream()
    }
  }, [])

  return (
    <div className={panelClassName}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#111111]">
            {verifiedPass ? "Visitor Name" : "Visitor Pass Token"}
          </label>
          <div className="relative">
            <input
              type="text"
              className={inputClassName}
              value={verifiedPass ? verifiedPass.visitorName : token}
              onChange={(event) => onTokenChange(event.target.value)}
              placeholder="Scan QR or enter token"
            />
            {verifiedPass && (
              <button
                type="button"
                onClick={() => onTokenChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-[#07584F]/10 px-2 py-0.5 text-xs font-semibold text-[#07584F] hover:bg-[#07584F]/20 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex items-end">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={outlineButtonClassName}
              onClick={isScanning ? stopScanner : startScanner}
            >
              {isScanning ? (
                <CameraOff className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {isScanning ? "Stop Scan" : "Scan QR Code"}
            </button>
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={onVerify}
              disabled={isVerifying}
            >
              <QrCode className="h-4 w-4" />
              {isVerifying ? "Verifying..." : "Verify Pass"}
            </button>
          </div>
        </div>
      </div>

      {isScanning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6">
          <div className="w-full max-w-md overflow-hidden rounded-lg bg-[#111111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
              <div className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4" />
                Scan Visitor QR
              </div>
              <button
                type="button"
                aria-label="Close scanner"
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                onClick={stopScanner}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                />
                <div className="pointer-events-none absolute inset-8 rounded-lg border border-white/20" />
                <div className="pointer-events-none absolute left-8 top-8 h-10 w-10 rounded-tl-lg border-l-4 border-t-4 border-white" />
                <div className="pointer-events-none absolute right-8 top-8 h-10 w-10 rounded-tr-lg border-r-4 border-t-4 border-white" />
                <div className="pointer-events-none absolute bottom-8 left-8 h-10 w-10 rounded-bl-lg border-b-4 border-l-4 border-white" />
                <div className="pointer-events-none absolute bottom-8 right-8 h-10 w-10 rounded-br-lg border-b-4 border-r-4 border-white" />
              </div>
              {scannerMessage ? (
                <p className="mt-3 text-center text-sm text-white/80">
                  {scannerMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!isScanning && scannerError ? (
        <p className="mt-2 text-sm text-red-700">{scannerError}</p>
      ) : !isScanning && scannerMessage ? (
        <p className="mt-2 text-sm text-[#637083]">
          {scannerMessage}
        </p>
      ) : null}

      {verifiedPass ? (
        <div className="mt-5 rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Visitor
              </p>
              <p className="mt-1 font-medium text-[#111111]">
                {verifiedPass.visitorName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Phone
              </p>
              <p className="mt-1 text-sm text-[#111111]">
                {verifiedPass.visitorPhone || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Flat / Unit
              </p>
              <p className="mt-1 text-sm text-[#111111]">
                {verifiedPass.flatNumber || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Purpose
              </p>
              <p className="mt-1 text-sm text-[#111111]">
                {verifiedPass.purpose || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#637083]">
                Vehicle
              </p>
              <p className="mt-1 text-sm text-[#111111]">
                {verifiedPass.vehicleNumber &&
                verifiedPass.vehicleNumber.trim() &&
                verifiedPass.vehicleNumber.trim().toLowerCase() !== "no vehicle" &&
                verifiedPass.vehicleNumber.trim().toLowerCase() !== "none"
                  ? verifiedPass.vehicleNumber
                  : "No vehicle"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Visitor Pass Verified & Gate Entry Granted</span>
            </div>
            <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
              Active Inside
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
