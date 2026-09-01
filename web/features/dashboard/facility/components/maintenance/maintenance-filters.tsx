import {
  complaintCategories,
  maintenanceStatuses,
  priorities,
  type ComplaintCategory,
  type MaintenanceStatus,
  type Priority,
} from "../../facility.types"
import {
  FilterSelect,
  SearchBox,
  Toolbar,
} from "../facility-ui"

export type MaintenanceSortKey =
  | "newest"
  | "oldest"
  | "priority"
  | "status"
  | "category"

export const maintenanceSortOptions = [
  "newest",
  "oldest",
  "priority",
  "status",
  "category",
] as const

export function MaintenanceFilters({
  search,
  status,
  priority,
  category,
  sort,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onSortChange,
}: {
  search: string
  status: "all" | MaintenanceStatus
  priority: "all" | Priority
  category: "all" | ComplaintCategory
  sort: MaintenanceSortKey
  onSearchChange: (value: string) => void
  onStatusChange: (value: "all" | MaintenanceStatus) => void
  onPriorityChange: (value: "all" | Priority) => void
  onCategoryChange: (value: "all" | ComplaintCategory) => void
  onSortChange: (value: MaintenanceSortKey) => void
}) {
  return (
    <Toolbar>
      <SearchBox
        value={search}
        onChange={onSearchChange}
        placeholder="Search maintenance"
      />
      <FilterSelect
        label="status"
        value={status}
        options={maintenanceStatuses}
        onChange={onStatusChange}
      />
      <FilterSelect
        label="priority"
        value={priority}
        options={priorities}
        onChange={onPriorityChange}
      />
      <FilterSelect
        label="category"
        value={category}
        options={complaintCategories}
        onChange={onCategoryChange}
      />
      <FilterSelect
        label="sort"
        value={sort}
        options={maintenanceSortOptions}
        onChange={(value) => {
          if (value !== "all") onSortChange(value)
        }}
      />
    </Toolbar>
  )
}
