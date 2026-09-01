import type { FormEventHandler } from "react"
import { Hammer } from "lucide-react"

import type { Maintenance } from "../../facility.types"
import {
  FormLabel,
  formatCurrency,
  formatDate,
  formatId,
  formatLabel,
  StatusBadge,
  SubmitButton,
  TextArea,
  TextInput,
} from "../facility-ui"

export function ComplaintMaintenanceSection({
  relatedMaintenance,
  isLoading,
  canCreateMaintenance,
  onCreateMaintenance,
  isCreatingMaintenance,
}: {
  relatedMaintenance: Maintenance[]
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
                      {formatId(item._id)}
                    </p>
                    <p className="mt-1 text-[12px] text-[#66737F]">
                      {formatLabel(item.category)} - {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 grid gap-2 text-[12px] text-[#66737F] sm:grid-cols-3">
                  <span>Technician: {formatId(item.assignedStaff)}</span>
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
              <FormLabel label="Technician user ID">
                <TextInput name="assignedStaff" placeholder="64f..." />
              </FormLabel>
              <FormLabel label="Estimated cost">
                <TextInput name="estimatedCost" type="number" placeholder="0" />
              </FormLabel>
            </div>
            <FormLabel label="Remarks">
              <TextArea name="remarks" placeholder="Remarks" />
            </FormLabel>
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
