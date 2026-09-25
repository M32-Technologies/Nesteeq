
"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  X,
  LifeBuoy,
  Camera,
  UploadCloud,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createResidentComplaint,
  type CreateResidentComplaintPayload,
} from "../api/resident-dashboard.api";

interface CreateComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ComplaintFormValues {
  title: string;
  category: CreateResidentComplaintPayload["category"] | "";
  priority: CreateResidentComplaintPayload["priority"] | "";
  location: string;
  description: string;
}

const CATEGORY_OPTIONS: Array<{
  value: CreateResidentComplaintPayload["category"];
  label: string;
}> = [
  { value: "PLUMBING", label: "Plumbing (Pipes, Taps, Leakages)" },
  { value: "ELECTRICAL", label: "Electrical (Wiring, Lights, Switches)" },
  { value: "CLEANING", label: "Cleaning & Waste Management" },
  { value: "SECURITY", label: "Security & Access" },
  { value: "LIFT", label: "Elevator / Lift Issues" },
  { value: "WATER", label: "Water Supply & Tank Issues" },
  { value: "MAINTENANCE", label: "General Maintenance & Repairs" },
  { value: "OTHER", label: "Other Issues" },
];

const PRIORITY_OPTIONS: Array<{
  value: CreateResidentComplaintPayload["priority"];
  label: string;
  badgeClass: string;
}> = [
  { value: "LOW", label: "Low (Minor cosmetic / non-urgent)", badgeClass: "text-slate-600" },
  { value: "MEDIUM", label: "Medium (Standard maintenance)", badgeClass: "text-blue-600" },
  { value: "HIGH", label: "High (Affects daily living)", badgeClass: "text-amber-600" },
  { value: "URGENT", label: "Urgent (Hazard / Immediate attention)", badgeClass: "text-rose-600" },
];

const LOCATION_OPTIONS = [
  "Kitchen",
  "Master Bedroom",
  "Guest Bedroom",
  "Living Room",
  "Bathroom / Toilet",
  "Balcony",
  "Dining Area",
  "Utility / Service Area",
  "Main Entrance / Hallway",
  "Other / Outside Flat",
];

export function CreateComplaintModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateComplaintModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintFormValues>({
    defaultValues: {
      title: "",
      category: "",
      priority: "",
      location: "",
      description: "",
    },
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    reset();
    handleRemoveFile();
    onClose();
  };

  const onSubmit = async (values: ComplaintFormValues) => {
    try {
      if (!values.category || !values.priority || !values.location) {
        toast.error("Please fill in all required fields.");
        return;
      }

      const locationPrefix = `[Location: ${values.location}]\n\n`;
      let fullDescription = `${locationPrefix}${values.description.trim()}`;
      if (selectedFile) {
        fullDescription += `\n\n[Attached Photo Reference: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)]`;
      }

      await createResidentComplaint({
        title: values.title.trim(),
        description: fullDescription,
        category: values.category as CreateResidentComplaintPayload["category"],
        priority: values.priority as CreateResidentComplaintPayload["priority"],
      });

      toast.success("Complaint registered successfully! The facility team will review it.");

      await queryClient.invalidateQueries({
        queryKey: ["resident", "complaints"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["resident", "dashboard", "complaints"],
      });

      handleClose();
      onSuccess?.();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to submit complaint. Please check the details and try again.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#DDE3DF] px-5 sm:px-6 py-4 bg-[#F7F8F5]/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#07584F]/10 text-[#07584F]">
              <LifeBuoy className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[#111111]">
                Create Complaint
              </h2>
              <p className="text-xs text-[#637083]">
                Report an issue to your society facility management team.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-[#637083] hover:bg-[#EEF1F4] hover:text-[#111111] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 text-xs sm:text-sm">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111111]">
                Complaint Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Kitchen sink pipe is leaking water"
                {...register("title", {
                  required: "Title is required",
                  minLength: {
                    value: 3,
                    message: "Title must be at least 3 characters",
                  },
                  maxLength: {
                    value: 120,
                    message: "Title cannot exceed 120 characters",
                  },
                })}
                className={`w-full rounded-lg border px-3 py-2 text-xs sm:text-sm text-[#111111] placeholder:text-[#7C8782] outline-none transition-colors ${
                  errors.title
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                    : "border-[#DDE3DF] bg-[#F7F8F5] focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
                }`}
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                  <AlertCircle className="size-3" />
                  <span>{errors.title.message}</span>
                </p>
              )}
            </div>

            {/* Category & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111111]">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("category", { required: "Please select a category" })}
                  className={`w-full rounded-lg border px-3 py-2 text-xs sm:text-sm text-[#111111] outline-none transition-colors ${
                    errors.category
                      ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                      : "border-[#DDE3DF] bg-[#F7F8F5] focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
                  }`}
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                    <AlertCircle className="size-3" />
                    <span>{errors.category.message}</span>
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111111]">
                  Priority Level <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("priority", { required: "Please select a priority" })}
                  className={`w-full rounded-lg border px-3 py-2 text-xs sm:text-sm text-[#111111] outline-none transition-colors ${
                    errors.priority
                      ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                      : "border-[#DDE3DF] bg-[#F7F8F5] focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
                  }`}
                >
                  <option value="" disabled>
                    Select Priority
                  </option>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                    <AlertCircle className="size-3" />
                    <span>{errors.priority.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Location in Flat */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111111]">
                Location in Flat <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("location", { required: "Please select a location" })}
                className={`w-full rounded-lg border px-3 py-2 text-xs sm:text-sm text-[#111111] outline-none transition-colors ${
                  errors.location
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                    : "border-[#DDE3DF] bg-[#F7F8F5] focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
                }`}
              >
                <option value="" disabled>
                  Select Location
                </option>
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                  <AlertCircle className="size-3" />
                  <span>{errors.location.message}</span>
                </p>
              )}
              <p className="text-[11px] text-[#637083]">
                Helps technicians quickly identify where inside the apartment the issue is located.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111111]">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe the issue in detail (when it started, what happens, any specific concerns)..."
                {...register("description", {
                  required: "Description is required",
                  minLength: {
                    value: 10,
                    message: "Description must be at least 10 characters",
                  },
                  maxLength: {
                    value: 3000,
                    message: "Description cannot exceed 3000 characters",
                  },
                })}
                className={`w-full rounded-lg border p-3 text-xs sm:text-sm text-[#111111] placeholder:text-[#7C8782] outline-none transition-colors ${
                  errors.description
                    ? "border-rose-300 bg-rose-50/30 focus:border-rose-500"
                    : "border-[#DDE3DF] bg-[#F7F8F5] focus:border-[#07584F] focus:bg-white focus:ring-2 focus:ring-[#07584F]/15"
                }`}
              />
              {errors.description && (
                <p className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                  <AlertCircle className="size-3" />
                  <span>{errors.description.message}</span>
                </p>
              )}
            </div>

            {/* Photo Upload Area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111111]">
                Attach Photo (Optional)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (!file.type.startsWith("image/")) {
                        toast.error("Please drop a valid image file");
                        return;
                      }
                      setSelectedFile(file);
                      setFilePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#DDE3DF] bg-[#F7F8F5]/80 p-4 text-center cursor-pointer transition hover:border-[#07584F] hover:bg-[#F7F8F5]"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-white border border-[#DDE3DF] text-[#07584F] shadow-2xs">
                    <Camera className="size-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-[#111111]">
                      Click or drag and drop to upload photo
                    </p>
                    <p className="text-[11px] text-[#7C8782]">
                      PNG, JPG or WEBP up to 5MB (Recorded as ticket photo reference)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-[#DDE3DF] bg-[#F7F8F5] p-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="size-10 rounded-lg object-cover border border-[#DDE3DF]"
                      />
                    ) : (
                      <ImageIcon className="size-5 text-[#07584F]" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#111111] truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-[#7C8782]">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="rounded-lg p-1.5 text-[#637083] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    title="Remove image"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#DDE3DF] px-5 sm:px-6 py-3.5 bg-[#F7F8F5]/60">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[#DDE3DF] bg-white px-4 py-2 text-xs font-medium text-[#637083] hover:bg-[#F7F8F5] hover:text-[#111111] transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#07584F] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#064C44] transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <FileText className="size-3.5" />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

