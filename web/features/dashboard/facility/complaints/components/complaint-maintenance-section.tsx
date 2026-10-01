import type { FormEventHandler } from "react"
import { Hammer } from "lucide-react"

import type { Complaint } from "@/features/dashboard/facility/complaints/types/complaints.types"
import type { Maintenance } from "@/features/dashboard/facility/maintenance/types/maintenance.types"
import {
  FormLabel,
  formatCurrency,
  formatDate,
  formatId,
  formatLabel,
  MaintenanceTypeSelect,
  StatusBadge,
  SubmitButton,
  TechnicianSelect,
  TextArea,
  TextInput,
} from "@/features/dashboard/facility/shared/components"

export function ComplaintMaintenanceSection({
  complaint,
  relatedMaintenance = [],
  isLoading,
  canCreateMaintenance,
  onCreateMaintenance,
  isCreatingMaintenance,
}: {
  complaint?: Complaint | null
  relatedMaintenance?: Maintenance[]
  isLoading: boolean
  canCreateMaintenance: boolean
  onCreateMaintenance: FormEventHandler<HTMLFormElement>
  isCreatingMaintenance: boolean
}) {
  return (
    <section className="border-b border-[#E8EDF2] py-5">
      <h3 className="text-[15px] font-semibold text-[#111111]">
        Maintenance
      </h3>
      <div className="mt-4">
        {isLoading ? (
          <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
            Loading maintenance...
          </div>
        ) : relatedMaintenance.length > 0 ? (
          <div className="space-y-3">
            {relatedMaintenance.map((item) => (
              <div
                key={item._id}
                className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111]">
                      {item.title ? `${item.title} (${item.category})` : formatId(item._id)}
                    </p>
                    <p className="mt-1 text-[12px] text-[#66737F]">
                      Ticket {formatId(item._id)} &bull; {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 grid gap-2 text-[12px] text-[#66737F] sm:grid-cols-3">
                  <span>
                    Technician:{" "}
                    {formatId(
                      typeof item.assignedTo === "object"
                        ? item.assignedTo?.name || item.assignedTo?._id
                        : item.assignedTo || "Unassigned"
                    )}
                  </span>
                  <span>Estimate: {formatCurrency(item.estimatedCost)}</span>
                  <span>Actual: {formatCurrency(item.finalCost)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-[#E2E8EE] bg-[#FBFCFD] p-4 text-[13px] text-[#66737F]">
            No maintenance work is linked.
          </div>
        )}

        {canCreateMaintenance ? (
          <form
            onSubmit={onCreateMaintenance}
            className="mt-4 grid gap-3 rounded-lg border border-[#E2E8EE] bg-white p-4"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#111111]">
              <Hammer className="size-4 text-[#07584F]" />
              Create maintenance work
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormLabel label="Maintenance Type / Task">
                <MaintenanceTypeSelect
                  name="maintenanceType"
                  defaultCategory={complaint?.category}
                  placeholder="Select maintenance type / task..."
                  required
                />
              </FormLabel>
              <FormLabel label="Assign Technician">
                <TechnicianSelect
                  name="assignedStaff"
                  placeholder="Select technician (optional)..."
                />
              </FormLabel>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormLabel label="Estimated cost (₹)">
                <TextInput
                  name="estimatedCost"
                  type="number"
                  placeholder="0"
                />
              </FormLabel>
              <FormLabel label="Remarks / Work Notes">
                <TextArea
                  name="remarks"
                  placeholder="Instructions or notes for maintenance work"
                />
              </FormLabel>
            </div>

            <div>
              <SubmitButton isLoading={isCreatingMaintenance}>
                Create Maintenance
              </SubmitButton>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  )
}
