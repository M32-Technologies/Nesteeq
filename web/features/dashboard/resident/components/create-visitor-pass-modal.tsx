"use client";

import React, { useState } from "react";
import {
  QrCode,
  X,
  User,
  Phone,
  ShieldCheck,
  Check,
  Copy,
  Download,
  Share2,
  Car,
  Bike,
  Zap,
  HelpCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createResidentGuestPass,
  type GuestPassItem,
  type CreateResidentGuestPassPayload,
} from "../api/resident-dashboard.api";

const VEHICLE_TYPE_OPTIONS = [
  { value: "CAR", label: "Car", icon: Car },
  { value: "BIKE", label: "Bike / 2W", icon: Bike },
  { value: "EV", label: "EV", icon: Zap },
  { value: "OTHER", label: "Other", icon: HelpCircle },
] as const;

const DURATION_OPTIONS = [
  { value: 4, label: "4 Hours", desc: "Short visit / Delivery" },
  { value: 8, label: "8 Hours", desc: "Workday / Standard" },
  { value: 12, label: "12 Hours", desc: "Evening / Half-day" },
  { value: 24, label: "24 Hours", desc: "Full-day / Overnight" },
] as const;

const QUICK_PURPOSE_TAGS = [
  "Guest Visit",
  "Family / Friends",
  "Delivery / Courier",
  "Home Service",
  "Cab / Pick up",
  "Maintenance",
];

export interface CreateVisitorPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  flatUnitName?: string;
  onSuccess?: () => void;
}

export function CreateVisitorPassModal({
  isOpen,
  onClose,
  flatUnitName,
  onSuccess,
}: CreateVisitorPassModalProps) {
  const queryClient = useQueryClient();

  // Form State
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<"CAR" | "BIKE" | "EV" | "OTHER">("CAR");
  const [durationHours, setDurationHours] = useState(8);

  // QR Modal State
  const [activeQrModalPass, setActiveQrModalPass] = useState<GuestPassItem | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const resetForm = () => {
    setVisitorName("");
    setVisitorPhone("");
    setPurpose("");
    setHasVehicle(false);
    setVehicleNumber("");
    setVehicleType("CAR");
    setDurationHours(8);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCloseQrModal = () => {
    setActiveQrModalPass(null);
    onClose();
  };

  // Create Pass Mutation
  const createPassMutation = useMutation({
    mutationFn: (payload: CreateResidentGuestPassPayload) =>
      createResidentGuestPass(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["resident", "passes"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "dashboard", "passes"] });
      queryClient.invalidateQueries({ queryKey: ["resident", "parking-info"] });
      toast.success("Visitor pass generated successfully!");
      resetForm();

      if (res?.data?.guestPass) {
        setActiveQrModalPass({
          ...res.data.guestPass,
          token: res.data.token || res.data.guestPass.token,
          qrCodeDataUrl: res.data.qrCodeDataUrl || res.data.guestPass.qrCodeDataUrl,
        });
      } else {
        handleClose();
      }
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate visitor pass. Please check your inputs.";
      toast.error(msg);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      toast.error("Visitor name is required");
      return;
    }

    if (hasVehicle && !vehicleNumber.trim()) {
      toast.error("Please enter the vehicle license plate number, or uncheck the vehicle option.");
      return;
    }

    const payload: CreateResidentGuestPassPayload = {
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim() || undefined,
      purpose: purpose.trim() || undefined,
      durationHours,
      ...(hasVehicle && vehicleNumber.trim()
        ? {
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
            vehicleType,
          }
        : {}),
    };

    createPassMutation.mutate(payload);
  };

  const handleCopyCode = async (tokenString: string) => {
    try {
      await navigator.clipboard.writeText(tokenString);
      setCopiedToken(true);
      toast.success("Pass token copied to clipboard!");
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      toast.error("Failed to copy pass code");
    }
  };

  const handleDownloadQr = (token: string, visitor: string) => {
    const svg = document.getElementById(`modal-qr-svg-${token}`);
    if (!svg) {
      toast.error("QR Code image element not found");
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          const safeName = visitor.toLowerCase().replace(/[^a-z0-9]/g, "-");
          downloadLink.download = `nesteeq-visitor-pass-${safeName}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          toast.success("QR Code downloaded successfully!");
        }
      };
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    } catch {
      toast.error("Could not export QR code image");
    }
  };

  const handleSharePass = async (pass: GuestPassItem) => {
    const code = pass.token || (pass._id ? pass._id.slice(-8).toUpperCase() : "PASS");
    const unitLabel = pass.flatNumber || flatUnitName || "Assigned Flat";
    const vehicleText = pass.vehicleNumber
      ? `${pass.vehicleNumber} (${pass.vehicleType || "Vehicle"})`
      : "None";

    const shareText =
      `🏢 *Nesteeq Visitor Gate Pass*\n\n` +
      `👤 *Visitor:* ${pass.visitorName}\n` +
      `📍 *Destination:* ${unitLabel}\n` +
      `🚗 *Vehicle:* ${vehicleText}\n` +
      `⏱️ *Valid Until:* ${new Date(pass.validUntil).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })}\n` +
      `🔑 *Gate Pass Code:* ${code}\n\n` +
      `Present this pass code or QR code to the Security Guard at the entrance gate for instant gate clearance.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Nesteeq Gate Pass for ${pass.visitorName}`,
          text: shareText,
        });
        return;
      } catch {
        // User dismissed
      }
    } else {
      await handleCopyCode(code);
    }
  };

  if (!isOpen && !activeQrModalPass) return null;

  return (
    <>
      {/* 1. CREATE VISITOR PASS MODAL */}
      {isOpen && !activeQrModalPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-[#DDE3DF] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DDE3DF] bg-[#F7F8F5] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#07584F] text-white">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#111111]">
                    Generate Visitor Pass
                  </h2>
                  <p className="text-xs text-[#637083]">
                    Pre-approve visitor for instant QR gate entry
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-[#7C8782] hover:bg-slate-200/60 hover:text-[#111111] transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {/* Unit Info Badge */}
              <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 border border-emerald-200/70 px-3.5 py-2 text-xs">
                <span className="text-[#637083]">Visiting Destination:</span>
                <span className="font-semibold text-emerald-900">
                  {flatUnitName || "Assigned Flat / Unit"}
                </span>
              </div>

              {/* Visitor Name (Required) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#111111]">
                  Visitor Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7C8782]" />
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="h-10 w-full rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] pl-9 pr-3.5 text-sm text-[#111111] placeholder:text-[#7C8782] outline-none transition focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
                  />
                </div>
              </div>

              {/* Visitor Phone (Optional) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#111111]">
                  Visitor Phone Number <span className="text-[#7C8782] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7C8782]" />
                  <input
                    type="tel"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="h-10 w-full rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] pl-9 pr-3.5 text-sm text-[#111111] placeholder:text-[#7C8782] outline-none transition focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
                  />
                </div>
              </div>

              {/* Purpose of Visit */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#111111]">
                  Purpose of Visit
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Personal Guest / Dinner / Delivery"
                  className="h-10 w-full rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] px-3.5 text-sm text-[#111111] placeholder:text-[#7C8782] outline-none transition focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
                />

                {/* Quick tags */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_PURPOSE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setPurpose(tag)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                        purpose === tag
                          ? "bg-[#07584F] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Toggle */}
              <div className="rounded-lg border border-[#DDE3DF] bg-[#F7F8F5] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#111111] block">
                      Visitor has a Vehicle?
                    </span>
                    <span className="text-[11px] text-[#637083]">
                      Security will verify vehicle number & allocate guest parking
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="modalHasVehicleToggle"
                    checked={hasVehicle}
                    onChange={(e) => setHasVehicle(e.target.checked)}
                    className="size-4.5 rounded border-slate-300 text-[#07584F] focus:ring-[#07584F] cursor-pointer"
                  />
                </div>

                {hasVehicle && (
                  <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[#DDE3DF]/60 animate-in fade-in duration-150">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#111111]">
                        Vehicle License Plate
                      </label>
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. MH 02 AB 1234"
                        className="h-9 w-full rounded-lg border border-[#DDE3DF] bg-white px-3 font-mono text-xs uppercase text-[#111111] placeholder:text-[#7C8782] outline-none focus:border-[#07584F] focus:ring-1 focus:ring-[#07584F]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#111111]">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e) =>
                          setVehicleType(e.target.value as "CAR" | "BIKE" | "EV" | "OTHER")
                        }
                        className="h-9 w-full rounded-lg border border-[#DDE3DF] bg-white px-2.5 text-xs text-[#111111] outline-none focus:border-[#07584F] focus:ring-1 focus:ring-[#07584F]"
                      >
                        {VEHICLE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Pass Validity Duration */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#111111]">
                  Pass Validity Duration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDurationHours(opt.value)}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition cursor-pointer ${
                        durationHours === opt.value
                          ? "border-[#07584F] bg-[#07584F]/10 text-[#07584F] font-bold shadow-2xs"
                          : "border-[#DDE3DF] bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[10px] text-[#637083]">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#DDE3DF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-[#DDE3DF] bg-white px-4 py-2 text-xs font-semibold text-[#111111] hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createPassMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#07584F] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <QrCode className="size-4" />
                  <span>
                    {createPassMutation.isPending
                      ? "Generating Pass..."
                      : "Create & Generate QR"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. QR CODE VIEW & SHARE MODAL */}
      {activeQrModalPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-[#DDE3DF] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DDE3DF] bg-[#F7F8F5] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4.5 text-[#07584F]" />
                <h3 className="text-sm font-bold text-[#111111]">
                  Gate Visitor Pass
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseQrModal}
                className="rounded-lg p-1 text-[#7C8782] hover:bg-slate-200/60 hover:text-[#111111] transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* QR Visual Content */}
            <div className="p-6 text-center space-y-4">
              {/* QR Container */}
              <div className="inline-block p-4 rounded-2xl bg-white border-2 border-[#DDE3DF] shadow-md">
                <QRCodeSVG
                  id={`modal-qr-svg-${activeQrModalPass.token || activeQrModalPass._id}`}
                  value={activeQrModalPass.token || activeQrModalPass._id}
                  size={210}
                  level="M"
                  includeMargin
                  className="rounded-lg"
                />
              </div>

              {/* Pass Status Badge */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ${
                    activeQrModalPass.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-100 text-slate-700 ring-slate-200"
                  }`}
                >
                  <span className="size-2 rounded-full bg-current" />
                  {activeQrModalPass.status === "ACTIVE"
                    ? "Active Gate Clearance"
                    : activeQrModalPass.status}
                </span>
              </div>

              {/* Visitor Details Card */}
              <div className="rounded-xl border border-[#DDE3DF] bg-[#F7F8F5] p-3.5 text-left text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#637083]">Visitor Name</span>
                  <span className="font-bold text-[#111111] text-sm">
                    {activeQrModalPass.visitorName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#637083]">Destination Flat</span>
                  <span className="font-semibold text-[#111111]">
                    {activeQrModalPass.flatNumber || flatUnitName || "Resident Unit"}
                  </span>
                </div>

                {activeQrModalPass.purpose && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#637083]">Purpose</span>
                    <span className="font-medium text-[#111111]">
                      {activeQrModalPass.purpose}
                    </span>
                  </div>
                )}

                {activeQrModalPass.vehicleNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#637083]">Vehicle</span>
                    <span className="font-mono font-bold text-[#111111]">
                      {activeQrModalPass.vehicleNumber}{" "}
                      {activeQrModalPass.vehicleType && `(${activeQrModalPass.vehicleType})`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[#637083]">Valid Until</span>
                  <span className="font-medium text-emerald-700">
                    {new Date(activeQrModalPass.validUntil).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>

              {/* Pass Token Copy Field */}
              <div className="rounded-lg border border-[#DDE3DF] bg-slate-50 p-2 flex items-center justify-between">
                <div className="text-left overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-[#7C8782] block">
                    Security Pass Code
                  </span>
                  <span className="font-mono text-xs font-bold text-[#111111] truncate block">
                    {activeQrModalPass.token || activeQrModalPass._id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyCode(activeQrModalPass.token || activeQrModalPass._id)
                  }
                  className="rounded-md bg-white border border-[#DDE3DF] px-2.5 py-1 text-xs font-semibold text-[#07584F] hover:bg-slate-50 transition cursor-pointer shadow-2xs shrink-0 ml-2"
                >
                  {copiedToken ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <Check className="size-3" /> Copied
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Copy className="size-3" /> Copy
                    </span>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadQr(
                      activeQrModalPass.token || activeQrModalPass._id,
                      activeQrModalPass.visitorName
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DDE3DF] bg-white py-2 text-xs font-semibold text-[#111111] hover:bg-slate-50 transition cursor-pointer"
                >
                  <Download className="size-3.5 text-[#07584F]" />
                  <span>Download QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSharePass(activeQrModalPass)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#07584F] py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer"
                >
                  <Share2 className="size-3.5" />
                  <span>Share Pass</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
