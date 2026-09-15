import {
  complaintCategories,
  complaintStatuses,
  priorities,
  type ComplaintCategory,
  type ComplaintStatus,
  type Priority,
} from "@/features/dashboard/facility/complaints/types/complaints.types"
import {
  FilterSelect,
  SearchBox,
  SortSelect,
  Toolbar,
} from "@/features/dashboard/facility/shared/components/facility-ui"

export type ComplaintSortKey =
  | "newest"
  | "oldest"
  | "priority"
  | "status"
  | "category"

export const complaintSortOptions = [
  "newest",
  "oldest",
  "priority",
  "status",
  "category",
] as const

export function ComplaintsFilters({
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
  status: "all" | ComplaintStatus
  priority: "all" | Priority
  category: "all" | ComplaintCategory
  sort: ComplaintSortKey
  onSearchChange: (value: string) => void
  onStatusChange: (value: "all" | ComplaintStatus) => void
  onPriorityChange: (value: "all" | Priority) => void
  onCategoryChange: (value: "all" | ComplaintCategory) => void
  onSortChange: (value: ComplaintSortKey) => void
}) {
  return (
    <Toolbar>
      <SearchBox
        value={search}
        onChange={onSearchChange}
        placeholder="Search complaints"
      />
      <FilterSelect
        label="status"
        value={status}
        options={complaintStatuses}
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
      <SortSelect
        value={sort}
        options={complaintSortOptions}
        onChange={onSortChange}
      />
    </Toolbar>
  )
}
