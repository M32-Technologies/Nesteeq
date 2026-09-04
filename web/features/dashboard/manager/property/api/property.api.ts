import { isAxiosError } from "axios"

import api from "@/lib/axios"

import type {
  CreatePropertyBlockInput,
  CreatePropertyFlatInput,
  GeneratePropertyFlatsInput,
  GeneratePropertyFlatsResult,
  PropertyApartment,
  PropertyBlock,
  PropertyBlockListParams,
  PropertyFlat,
  PropertyFlatListParams,
  PropertyFlatListResult,
  PropertyStats,
  UpdatePropertyBlockInput,
  UpdatePropertyFlatInput,
  UpdatePropertyFlatStatusInput,
} from "../types/property"

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
}

type ApiErrorResponse = {
  message?: string
  error?: string
  details?: unknown
}

type BlocksApiData = {
  blocks: ApiBlock[]
}

type FlatsApiData = {
  flats: ApiFlat[]
  page: number
  limit: number
  totalPages: number
  totalCount: number
}

type ApiBlock = Partial<PropertyBlock> & {
  _id?: string
  name?: string
}

type ApiApartment = Partial<PropertyApartment> & {
  _id?: string
  totalBlocks?: string | number
  totalUnits?: string | number
}

type ApiFlat = Partial<PropertyFlat> & {
  _id?: string
}

const mapFlat = (flat: ApiFlat): PropertyFlat => ({
  id: flat.id || flat._id || "-",
  apartmentId: flat.apartmentId || "-",
  blockId: flat.blockId || flat.block?.id || "-",
  block: flat.block,
  residentId: flat.residentId ?? null,
  resident: flat.resident ?? null,
  floorNumber: flat.floorNumber ?? 0,
  flatNumber: flat.flatNumber || "-",
  occupancyStatus: flat.occupancyStatus || "VACANT",
  status: flat.status || "active",
  createdAt: flat.createdAt ?? null,
  updatedAt: flat.updatedAt ?? null,
})

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || error.response?.data?.error || fallback
  }

  return error instanceof Error ? error.message : fallback
}

const toNumber = (value: string | number | undefined) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

const mapBlock = (block: ApiBlock): PropertyBlock => ({
  id: block.id || block._id || "-",
  apartmentId: block.apartmentId || "-",
  blockname: block.blockname || block.name || "-",
  code: block.code || "-",
  totalFloors: block.totalFloors ?? 0,
  status: block.status || "active",
  createdAt: block.createdAt ?? null,
  updatedAt: block.updatedAt ?? null,
})

const mapApartment = (apartment: ApiApartment): PropertyApartment => ({
  id: apartment.id || apartment._id || "-",
  name: apartment.name || "-",
  totalBlocks: toNumber(apartment.totalBlocks),
  totalUnits: toNumber(apartment.totalUnits),
  status: apartment.status || "-",
})

export const getCurrentPropertyApartment =
  async (): Promise<PropertyApartment> => {
    try {
      const response = await api.get<ApiResponse<ApiApartment>>(
        "/api/v1/apartment/current"
      )

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch apartment details"
        )
      }

      return mapApartment(response.data.data)
    } catch (error) {
      throw new Error(
        getApiErrorMessage(error, "Failed to fetch apartment details")
      )
    }
  }

export const getPropertyBlocks = async (
  params: PropertyBlockListParams = {}
): Promise<PropertyBlock[]> => {
  try {
    const response = await api.get<ApiResponse<BlocksApiData>>(
      "/api/v1/blocks",
      {
        params,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch blocks")
    }

    return response.data.data.blocks.map(mapBlock)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch blocks"))
  }
}

export const createPropertyBlock = async (
  input: CreatePropertyBlockInput
): Promise<PropertyBlock> => {
  try {
    const response = await api.post<ApiResponse<{ block: ApiBlock }>>(
      "/api/v1/blocks",
      input
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to create block")
    }

    return mapBlock(response.data.data.block)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create block"))
  }
}

export const updatePropertyBlock = async ({
  blockId,
  input,
}: {
  blockId: string
  input: UpdatePropertyBlockInput
}): Promise<PropertyBlock> => {
  try {
    const response = await api.patch<ApiResponse<{ block: ApiBlock }>>(
      `/api/v1/blocks/${blockId}`,
      input
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update block")
    }

    return mapBlock(response.data.data.block)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update block"))
  }
}

export const deactivatePropertyBlock = async (
  blockId: string
): Promise<PropertyBlock> => {
  try {
    const response = await api.delete<ApiResponse<{ block: ApiBlock }>>(
      `/api/v1/blocks/${blockId}`
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to deactivate block")
    }

    return mapBlock(response.data.data.block)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to deactivate block"))
  }
}

export const getPropertyFlats = async (
  params: PropertyFlatListParams = {}
): Promise<PropertyFlatListResult> => {
  const response = await api.get<ApiResponse<FlatsApiData>>(
    "/api/v1/flats",
    {
      params: {
        search: params.search?.trim() || undefined,
        blockId: params.blockId,
        floorNumber:
          typeof params.floorNumber === "string"
            ? params.floorNumber.trim() || undefined
            : params.floorNumber,
        occupancyStatus: params.occupancyStatus,
        status: params.status,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    }
  )

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch flats")
  }

  return {
    ...response.data.data,
    totalPages: Math.max(1, response.data.data.totalPages),
    flats: response.data.data.flats.map(mapFlat),
  }
}

export const getPropertyFlatById = async (
  flatId: string
): Promise<PropertyFlat> => {
  try {
    const response = await api.get<ApiResponse<{ flat: ApiFlat }>>(
      `/api/v1/flats/${flatId}`
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to fetch flat")
    }

    return mapFlat(response.data.data.flat)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch flat"))
  }
}

export const createPropertyFlat = async (
  input: CreatePropertyFlatInput
): Promise<PropertyFlat> => {
  try {
    const response = await api.post<ApiResponse<{ flat: ApiFlat }>>(
      "/api/v1/flats",
      input
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to create flat")
    }

    const flat = response.data.data.flat

    return mapFlat(flat)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to create flat"))
  }
}

export const updatePropertyFlat = async ({
  flatId,
  input,
}: {
  flatId: string
  input: UpdatePropertyFlatInput
}): Promise<PropertyFlat> => {
  try {
    const response = await api.patch<ApiResponse<{ flat: ApiFlat }>>(
      `/api/v1/flats/${flatId}`,
      {
        floorNumber: input.floorNumber,
        flatNumber: input.flatNumber?.trim().toUpperCase(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update flat")
    }

    return mapFlat(response.data.data.flat)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update flat"))
  }
}

export const updatePropertyFlatStatus = async ({
  flatId,
  input,
}: {
  flatId: string
  input: UpdatePropertyFlatStatusInput
}): Promise<PropertyFlat> => {
  try {
    const response = await api.patch<ApiResponse<{ flat: ApiFlat }>>(
      `/api/v1/flats/${flatId}/status`,
      input
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update flat status")
    }

    return mapFlat(response.data.data.flat)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to update flat status"))
  }
}

export const generatePropertyFlats = async (
  input: GeneratePropertyFlatsInput
): Promise<GeneratePropertyFlatsResult> => {
  try {
    const response = await api.post<ApiResponse<GeneratePropertyFlatsResult>>(
      "/api/v1/flats/generate",
      input
    )

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to generate flats")
    }

    return response.data.data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to generate flats"))
  }
}

export const getPropertyStats = async (): Promise<PropertyStats> => {
  const [apartment, blocks, flats, owners, tenants, vacant] = await Promise.all([
    getCurrentPropertyApartment(),
    getPropertyBlocks({ status: "active" }),
    getPropertyFlats({ page: 1, limit: 1 }),
    getPropertyFlats({ occupancyStatus: "OWNER", page: 1, limit: 1 }),
    getPropertyFlats({ occupancyStatus: "TENANT", page: 1, limit: 1 }),
    getPropertyFlats({ occupancyStatus: "VACANT", page: 1, limit: 1 }),
  ])

  return {
    totalBlocks: blocks.length,
    apartmentTotalBlocks: apartment.totalBlocks,
    totalFlats: flats.totalCount,
    occupiedFlats: owners.totalCount + tenants.totalCount,
    vacantFlats: vacant.totalCount,
  }
}
