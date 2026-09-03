"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, CheckCircle2, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  useDeactivatePropertyBlockMutation,
  useUpdatePropertyBlockMutation,
} from "../hooks/use-property-query"
import type {
  PropertyBlock,
  UpdatePropertyBlockInput,
} from "../types/property"

type BlockActionDialogProps = {
  block: PropertyBlock | null
  mode: "edit" | "deactivate" | "activate" | null
  onClose: () => void
}

const blockActionSchema = z.object({
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
})

type BlockActionFormValues = z.input<typeof blockActionSchema>

const fieldClassName =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0F5F45] focus:ring-2 focus:ring-[#0F5F45]/10 disabled:cursor-not-allowed disabled:bg-slate-50"

export default function BlockActionDialog({
  block,
  mode,
  onClose,
}: BlockActionDialogProps) {
  const updateBlock = useUpdatePropertyBlockMutation()
  const deactivateBlock = useDeactivatePropertyBlockMutation()
  const [formError, setFormError] = useState("")
  const isSubmitting = updateBlock.isPending || deactivateBlock.isPending
  const open = Boolean(block && mode)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<BlockActionFormValues>({
    resolver: zodResolver(blockActionSchema),
    defaultValues: {
      blockname: "",
      code: "",
      totalFloors: "",
    },
  })

  useEffect(() => {
    if (!block || mode !== "edit") return

    reset({
      blockname: block.blockname,
      code: block.code,
      totalFloors: String(block.totalFloors),
    })
  }, [block, mode, reset])

  if (!open || !block || !mode) {
    return null
  }

  const closeDialog = () => {
    if (isSubmitting) return

    setFormError("")
    clearErrors()
    onClose()
  }

  const submitEdit = async (values: BlockActionFormValues) => {
    const input: UpdatePropertyBlockInput = {
      blockname: values.blockname.trim(),
      code: values.code.trim().toUpperCase(),
      totalFloors: Number(values.totalFloors),
    }

    try {
      setFormError("")
      await updateBlock.mutateAsync({
        blockId: block.id,
        input,
      })
      toast.success("Block updated successfully")
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update block"

      if (message === "A block with this code already exists") {
        setError("code", {
          type: "server",
          message,
        })
        return
      }

      setFormError(message)
    }
  }

  const submitDeactivate = async () => {
    try {
      setFormError("")
      await deactivateBlock.mutateAsync(block.id)
      toast.success("Block deactivated successfully")
      onClose()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to deactivate block"
      )
    }
  }

  const submitActivate = async () => {
    try {
      setFormError("")
      await updateBlock.mutateAsync({
        blockId: block.id,
        input: {
          status: "active",
        },
      })
      toast.success("Block activated successfully")
      onClose()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to activate block"
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-8 sm:items-center">
      <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex min-h-[82px] items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold leading-7 text-slate-900">
              {mode === "edit"
                ? "Edit Block"
                : mode === "activate"
                  ? "Activate Block"
                  : "Deactivate Block"}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
              {mode === "edit"
                ? "Update this block's name, code, or floor count."
                : mode === "activate"
                  ? "This block will move back to active blocks."
                  : "This block will move to inactive blocks."}
            </p>
          </div>

          <button
            type="button"
            onClick={closeDialog}
            disabled={isSubmitting}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close block action dialog"
          >
            <X size={19} />
          </button>
        </div>

        {mode === "edit" ? (
          <form onSubmit={handleSubmit(submitEdit)}>
            <div className="space-y-5 px-6 py-5">
              {formError && <ErrorMessage message={formError} />}

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Block Name *
                </span>
                <input
                  type="text"
                  placeholder="Example: Block A"
                  disabled={isSubmitting}
                  {...register("blockname")}
                  className={fieldClassName}
                />
                {errors.blockname?.message && (
                  <FieldError message={errors.blockname.message} />
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Block Code *
                </span>
                <input
                  type="text"
                  placeholder="Example: A"
                  disabled={isSubmitting}
                  {...register("code", {
                    onChange: (event) => {
                      event.target.value = event.target.value.toUpperCase()
                    },
                  })}
                  className={fieldClassName}
                />
                <span className="mt-1.5 block text-xs font-medium text-slate-500">
                  A short unique code used to identify this block.
                </span>
                {errors.code?.message && (
                  <FieldError message={errors.code.message} />
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  Total Floors *
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="Example: 6"
                  disabled={isSubmitting}
                  onKeyDown={(event) => {
                    if (["-", "+", ".", "e", "E"].includes(event.key)) {
                      event.preventDefault()
                    }
                  }}
                  {...register("totalFloors")}
                  className={fieldClassName}
                />
                {errors.totalFloors?.message && (
                  <FieldError message={errors.totalFloors.message} />
                )}
              </label>
            </div>

            <DialogFooter
              cancelLabel="Cancel"
              submitLabel={updateBlock.isPending ? "Saving..." : "Save Changes"}
              submitDisabled={isSubmitting}
              onCancel={closeDialog}
            />
          </form>
        ) : mode === "deactivate" ? (
          <div>
            <div className="space-y-4 px-6 py-5">
              {formError && <ErrorMessage message={formError} />}

              <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Deactivate {block.blockname}?
                  </p>
                  <p className="mt-1 text-xs font-medium leading-5 text-red-600">
                    The block stays in records, but it will no longer appear as
                    an active block.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter
              cancelLabel="Cancel"
              submitLabel={
                deactivateBlock.isPending ? "Deactivating..." : "Deactivate"
              }
              submitDisabled={isSubmitting}
              submitTone="danger"
              onCancel={closeDialog}
              onSubmit={submitDeactivate}
            />
          </div>
        ) : (
          <div>
            <div className="space-y-4 px-6 py-5">
              {formError && <ErrorMessage message={formError} />}

              <div className="flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Activate {block.blockname}?
                  </p>
                  <p className="mt-1 text-xs font-medium leading-5 text-emerald-700">
                    The block will appear again in active blocks and block
                    selectors.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter
              cancelLabel="Cancel"
              submitLabel={updateBlock.isPending ? "Activating..." : "Activate"}
              submitDisabled={isSubmitting}
              onCancel={closeDialog}
              onSubmit={submitActivate}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function DialogFooter({
  cancelLabel,
  submitLabel,
  submitDisabled,
  submitTone = "primary",
  onCancel,
  onSubmit,
}: {
  cancelLabel: string
  submitLabel: string
  submitDisabled: boolean
  submitTone?: "primary" | "danger"
  onCancel: () => void
  onSubmit?: () => void
}) {
  const submitClassName =
    submitTone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-[#0F5F45] text-white hover:bg-[#0B4D38]"

  return (
    <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-white px-6 py-5 sm:grid-cols-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitDisabled}
        className="flex h-11 items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cancelLabel}
      </button>

      <button
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        disabled={submitDisabled}
        className={`flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${submitClassName}`}
      >
        {submitLabel}
      </button>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  )
}

function FieldError({ message }: { message: string }) {
  return (
    <span className="mt-1 block text-xs font-medium text-red-600">
      {message}
    </span>
  )
}
