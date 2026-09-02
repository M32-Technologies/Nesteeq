"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCreatePropertyBlockMutation } from "../hooks/use-property-query";
import type { CreatePropertyBlockInput } from "../types/property";

type AddBlockDialogProps = {
  open: boolean;
  apartmentTotalBlocks: number;
  createdActiveBlockCount: number;
  onClose: () => void;
};

const addBlockSchema = z.object({
  blockname: z.string().trim().min(1, "Block name is required"),
  code: z
    .string()
    .trim()
    .min(1, "Block code is required")
    .max(20, "Block code must be 20 characters or less"),
  totalFloors: z.coerce
    .number({
      message: "Total floors is required",
    })
    .int("Total floors must be a whole number")
    .min(1, "Total floors must be greater than 0"),
});

type AddBlockFormValues = z.input<typeof addBlockSchema>;

const fieldClassName =
  "h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:cursor-not-allowed disabled:bg-slate-50";

export default function AddBlockDialog({
  open,
  apartmentTotalBlocks,
  createdActiveBlockCount,
  onClose,
}: AddBlockDialogProps) {
  const createBlock = useCreatePropertyBlockMutation();
  const [formError, setFormError] = useState("");
  const hasReachedBlockLimit =
    apartmentTotalBlocks > 0 && createdActiveBlockCount >= apartmentTotalBlocks;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AddBlockFormValues>({
    resolver: zodResolver(addBlockSchema),
    defaultValues: {
      blockname: "",
      code: "",
      totalFloors: "",
    },
  });

  if (!open) {
    return null;
  }

  const closeDialog = () => {
    if (createBlock.isPending) {
      return;
    }

    reset();
    setFormError("");
    clearErrors();
    onClose();
  };

  const submitBlock = async (values: AddBlockFormValues) => {
    if (hasReachedBlockLimit) {
      setFormError("All apartment blocks have already been created.");
      return;
    }

    const input: CreatePropertyBlockInput = {
      blockname: values.blockname.trim(),
      code: values.code.trim().toUpperCase(),
      totalFloors: Number(values.totalFloors),
    };

    try {
      setFormError("");
      await createBlock.mutateAsync(input);
      toast.success("Block created successfully");
      reset();
      setFormError("");
      clearErrors();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create block";

      if (message === "A block with this code already exists") {
        setError("code", {
          type: "server",
          message,
        });
        setFormError("");
        return;
      }

      setFormError(
        message.includes("apartment blocks")
          ? "All apartment blocks have already been created."
          : message,
      );
      clearErrors("code");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-8 sm:items-center">
      <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex min-h-[84px] items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-7 text-slate-900">
              Add Block
            </h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
              Create a new block for this property.
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            disabled={createBlock.isPending}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close add block modal"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitBlock)}>
          <div className="space-y-5 px-6 py-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">
                {createdActiveBlockCount} / {apartmentTotalBlocks} blocks
                created
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Apartment total blocks comes from onboarding.
              </p>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-[15px] font-bold leading-5 text-slate-700">
                Block Name *
              </span>
              <input
                type="text"
                placeholder="Example: Block A"
                disabled={createBlock.isPending || hasReachedBlockLimit}
                {...register("blockname")}
                className={fieldClassName}
              />
              {errors.blockname?.message && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.blockname.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-[15px] font-bold leading-5 text-slate-700">
                Block Code *
              </span>
              <input
                type="text"
                placeholder="Example: A"
                disabled={createBlock.isPending || hasReachedBlockLimit}
                {...register("code", {
                  onChange: (event) => {
                    event.target.value = event.target.value.toUpperCase();
                  },
                })}
                className={fieldClassName}
              />
              <span className="mt-1.5 block text-xs font-medium text-slate-500">
                A short unique code used to identify this block.
              </span>
              {errors.code?.message && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.code.message}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-[15px] font-bold leading-5 text-slate-700">
                Total Floors *
              </span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="Example: 6"
                disabled={createBlock.isPending || hasReachedBlockLimit}
                onKeyDown={(event) => {
                  if (["-", "+", ".", "e", "E"].includes(event.key)) {
                    event.preventDefault();
                  }
                }}
                {...register("totalFloors")}
                className={fieldClassName}
              />
              {errors.totalFloors?.message && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  {errors.totalFloors.message}
                </span>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-white px-6 py-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={closeDialog}
              disabled={createBlock.isPending}
              className="flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createBlock.isPending || hasReachedBlockLimit}
              className="flex h-11 items-center justify-center rounded-lg bg-[#0F5F45] text-sm font-semibold text-white transition hover:bg-[#0B4D38] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createBlock.isPending ? "Creating..." : "Create Block"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
