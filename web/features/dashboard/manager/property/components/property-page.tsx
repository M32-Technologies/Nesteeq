"use client"

import { useMemo, useState } from "react"

import {
  useCurrentPropertyApartmentQuery,
  usePropertyBlocksQuery,
  usePropertyFlatsQuery,
  usePropertyStatsQuery,
} from "../hooks/use-property-query"
import type {
  FlatAdvancedFilters,
  PropertyBlockFilterStatus,
  PropertyFlatListParams,
  PropertyTab,
} from "../types/property"
import AddBlockDialog from "./add-block-dialog"
import AddFlatDialog from "./add-flat-dialog"
import BlocksTableSection from "./blocks-table-section"
import FlatsTableSection from "./flats-table-section"
import GenerateFlatsDialog from "./generate-flats-dialog"
import PropertyHeader from "./property-header"

const defaultAdvancedFilters: FlatAdvancedFilters = {
  floorNumber: "",
  occupancyStatus: "all",
  status: "all",
  sortBy: "flatNumber",
  sortOrder: "asc",
}

export default function PropertyPage() {
  const [activeTab, setActiveTab] = useState<PropertyTab>("blocks")
  const [blockStatus, setBlockStatus] =
    useState<PropertyBlockFilterStatus>("all")
  const [blockSearch, setBlockSearch] = useState("")
  const [flatSearch, setFlatSearch] = useState("")
  const [flatBlockId, setFlatBlockId] = useState("all")
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const [addBlockOpen, setAddBlockOpen] = useState(false)
  const [addFlatOpen, setAddFlatOpen] = useState(false)
  const [generateFlatsOpen, setGenerateFlatsOpen] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState(
    defaultAdvancedFilters
  )
  const [draftFilters, setDraftFilters] = useState(defaultAdvancedFilters)
  const limit = 10

  const { data: stats, isLoading: isStatsLoading } = usePropertyStatsQuery()
  const { data: apartment, isLoading: isApartmentLoading } =
    useCurrentPropertyApartmentQuery()
  const { data: blocks = [], isLoading: isBlocksLoading } =
    usePropertyBlocksQuery({
      status: blockStatus === "all" ? undefined : blockStatus,
    })
  const { data: activeBlocks = [], isLoading: isActiveBlocksLoading } =
    usePropertyBlocksQuery({
      status: "active",
    })

  const flatParams = useMemo<PropertyFlatListParams>(
    () => ({
      search: flatSearch.trim() || undefined,
      blockId: flatBlockId === "all" ? undefined : flatBlockId,
      floorNumber: advancedFilters.floorNumber.trim() || undefined,
      occupancyStatus:
        advancedFilters.occupancyStatus === "all"
          ? undefined
          : advancedFilters.occupancyStatus,
      status:
        advancedFilters.status === "all" ? undefined : advancedFilters.status,
      page,
      limit,
      sortBy: advancedFilters.sortBy,
      sortOrder: advancedFilters.sortOrder,
    }),
    [advancedFilters, flatBlockId, flatSearch, limit, page]
  )

  const {
    data: flatsData,
    isLoading: isFlatsLoading,
    isError: isFlatsError,
    error: flatsError,
  } = usePropertyFlatsQuery(flatParams)

  const apartmentTotalBlocks =
    apartment?.totalBlocks ?? stats?.apartmentTotalBlocks ?? 0
  const createdActiveBlockCount = activeBlocks.length
  const isAddBlockDisabled =
    apartmentTotalBlocks > 0 && createdActiveBlockCount >= apartmentTotalBlocks
  const addBlockDisabledReason = isAddBlockDisabled
    ? "All apartment blocks have already been created."
    : ""

  const blocksForTable = useMemo(() => {
    const query = blockSearch.trim().toLowerCase()

    if (!query) {
      return blocks
    }

    return blocks.filter((block) => {
      return (
        block.blockname.toLowerCase().includes(query) ||
        block.code.toLowerCase().includes(query)
      )
    })
  }, [blockSearch, blocks])

  const advancedFilterCount = [
    advancedFilters.floorNumber,
    advancedFilters.occupancyStatus !== "all",
    advancedFilters.status !== "all",
    advancedFilters.sortBy !== "flatNumber",
    advancedFilters.sortOrder !== "asc",
  ].filter(Boolean).length

  const resetFlatFilters = () => {
    setFlatSearch("")
    setFlatBlockId("all")
    setAdvancedFilters(defaultAdvancedFilters)
    setDraftFilters(defaultAdvancedFilters)
    setPage(1)
  }

  return (
    <div className="space-y-6 p-6">
      <PropertyHeader
        stats={stats}
        isLoading={isStatsLoading}
        apartmentTotalBlocks={apartmentTotalBlocks}
        isApartmentLoading={isApartmentLoading}
        activeBlockCount={createdActiveBlockCount}
        isActiveBlockCountLoading={isActiveBlocksLoading}
        activeTab={activeTab}
        isAddBlockDisabled={isAddBlockDisabled}
        addBlockDisabledReason={addBlockDisabledReason}
        onTabChange={setActiveTab}
        onAddBlockClick={() => {
          if (!isAddBlockDisabled) {
            setAddBlockOpen(true)
          }
        }}
        onAddFlatClick={() => setAddFlatOpen(true)}
        onGenerateFlatsClick={() => setGenerateFlatsOpen(true)}
      />

      <AddBlockDialog
        open={addBlockOpen}
        apartmentTotalBlocks={apartmentTotalBlocks}
        createdActiveBlockCount={createdActiveBlockCount}
        onClose={() => setAddBlockOpen(false)}
      />

      <AddFlatDialog
        open={addFlatOpen}
        onClose={() => setAddFlatOpen(false)}
      />

      <GenerateFlatsDialog
        open={generateFlatsOpen}
        onClose={() => setGenerateFlatsOpen(false)}
      />

      {activeTab === "blocks" ? (
        <BlocksTableSection
          blocks={blocksForTable}
          blockStatus={blockStatus}
          blockSearch={blockSearch}
          isLoading={isBlocksLoading}
          onSearchChange={setBlockSearch}
          onStatusChange={setBlockStatus}
        />
      ) : (
        <FlatsTableSection
          blocks={activeBlocks}
          flats={flatsData?.flats ?? []}
          search={flatSearch}
          blockId={flatBlockId}
          page={page}
          totalPages={flatsData?.totalPages ?? 1}
          totalCount={flatsData?.totalCount ?? 0}
          advancedFilterCount={advancedFilterCount}
          isLoading={isFlatsLoading}
          isError={isFlatsError}
          error={flatsError}
          filterOpen={filterOpen}
          draftFilters={draftFilters}
          onSearchChange={(value) => {
            setFlatSearch(value)
            setPage(1)
          }}
          onBlockChange={(value) => {
            setFlatBlockId(value)
            setPage(1)
          }}
          onPageChange={setPage}
          onOpenFilters={() => {
            setDraftFilters(advancedFilters)
            setFilterOpen(true)
          }}
          onCloseFilters={() => setFilterOpen(false)}
          onDraftFilterChange={setDraftFilters}
          onResetDraftFilters={() => setDraftFilters(defaultAdvancedFilters)}
          onApplyFilters={() => {
            setAdvancedFilters(draftFilters)
            setPage(1)
            setFilterOpen(false)
          }}
          onReset={resetFlatFilters}
        />
      )}
    </div>
  )
}
