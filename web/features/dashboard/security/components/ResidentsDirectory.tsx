"use client"

import { useState } from "react"
import { Eye, Search } from "lucide-react"

import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { useSecurityResidents } from "../hooks/useSecurityData"
import type { SecurityResidentDirectoryRecord } from "../services/security.interface"
import {
  DetailGrid,
  DetailModal,
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationControls,
  StatusBadge,
  formatDateTime,
  formatLabel,
  inputClassName,
  outlineButtonClassName,
  panelClassName,
  tableClassName,
  tableWrapClassName,
  tdClassName,
  thClassName,
} from "./SecurityUi"

const PAGE_SIZE = 12

export function ResidentsDirectory() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedResident, setSelectedResident] =
    useState<SecurityResidentDirectoryRecord | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const residentsQuery = useSecurityResidents({
    search: debouncedSearch.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const residents = residentsQuery.data?.residents ?? []
  const pagination = residentsQuery.data?.pagination

  const setSearchQuery = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">
          Residents Directory
        </h1>
        <p className="text-sm text-[#637083]">
          Search residents and flats for gate/security operations.
        </p>
      </div>

      <div className={panelClassName}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8782]" />
          <input
            type="search"
            className={`${inputClassName} pl-9`}
            value={search}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search resident name, flat, or phone"
          />
        </div>
      </div>

      {residentsQuery.isLoading ? (
        <LoadingState label="Loading residents directory..." />
      ) : residentsQuery.isError ? (
        <ErrorState label="Unable to load residents directory." />
      ) : residents.length === 0 ? (
        <EmptyState
          title="No residents found"
          description="Try searching by another name, flat, or phone."
        />
      ) : (
        <>
          <div className={tableWrapClassName}>
            <table className={tableClassName}>
              <thead>
                <tr>
                  <th className={thClassName}>Resident Name</th>
                  <th className={thClassName}>Flat / Unit</th>
                  <th className={thClassName}>Phone</th>
                  <th className={thClassName}>Occupancy</th>
                  <th className={thClassName}>Status</th>
                  <th className={thClassName}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {residents.map((resident) => (
                  <tr key={resident._id}>
                    <td className={tdClassName}>
                      <p className="font-medium">
                        {resident.name || resident.userId}
                      </p>
                      {resident.email ? (
                        <p className="text-xs text-[#637083]">
                          {resident.email}
                        </p>
                      ) : null}
                    </td>
                    <td className={tdClassName}>
                      {resident.flatNumber || resident.flatId}
                    </td>
                    <td className={tdClassName}>
                      {resident.phone || "-"}
                    </td>
                    <td className={tdClassName}>
                      {formatLabel(resident.residentType)}
                    </td>
                    <td className={tdClassName}>
                      <StatusBadge
                        status={resident.status.toUpperCase()}
                      />
                    </td>
                    <td className={tdClassName}>
                      <button
                        type="button"
                        className={outlineButtonClassName}
                        onClick={() =>
                          setSelectedResident(resident)
                        }
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination ? (
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              hasPreviousPage={pagination.hasPreviousPage}
              hasNextPage={pagination.hasNextPage}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      {selectedResident ? (
        <DetailModal
          title={selectedResident.name ?? selectedResident.userId}
          subtitle="Read-only resident details"
          onClose={() => setSelectedResident(null)}
        >
          <DetailGrid
            items={[
              {
                label: "Resident Name",
                value:
                  selectedResident.name ??
                  selectedResident.userId,
              },
              {
                label: "Flat / Unit",
                value:
                  selectedResident.flatNumber ??
                  selectedResident.flatId,
              },
              {
                label: "Phone",
                value: selectedResident.phone ?? "-",
              },
              {
                label: "Email",
                value: selectedResident.email ?? "-",
              },
              {
                label: "Membership",
                value: formatLabel(
                  selectedResident.residentType
                ),
              },
              {
                label: "Status",
                value: (
                  <StatusBadge
                    status={selectedResident.status.toUpperCase()}
                  />
                ),
              },
              {
                label: "Joined",
                value: formatDateTime(
                  selectedResident.joinedAt
                ),
              },
            ]}
          />
        </DetailModal>
      ) : null}
    </div>
  )
}
