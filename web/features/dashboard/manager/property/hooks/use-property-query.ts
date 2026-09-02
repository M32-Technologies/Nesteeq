import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createPropertyBlock,
  createPropertyFlat,
  deactivatePropertyBlock,
  generatePropertyFlats,
  getCurrentPropertyApartment,
  getPropertyBlocks,
  getPropertyFlatById,
  getPropertyFlats,
  getPropertyStats,
  updatePropertyBlock,
  updatePropertyFlat,
  updatePropertyFlatStatus,
} from "../api/property.api"
import type {
  CreatePropertyBlockInput,
  CreatePropertyFlatInput,
  GeneratePropertyFlatsInput,
  PropertyBlockListParams,
  PropertyFlatListParams,
  UpdatePropertyBlockInput,
  UpdatePropertyFlatInput,
  UpdatePropertyFlatStatusInput,
} from "../types/property"

export const propertyQueryKeys = {
  all: ["property"] as const,
  apartment: () => [...propertyQueryKeys.all, "apartment"] as const,
  blocksRoot: () => [...propertyQueryKeys.all, "blocks"] as const,
  blocks: (params: PropertyBlockListParams) =>
    [...propertyQueryKeys.blocksRoot(), params] as const,
  flatsRoot: () => [...propertyQueryKeys.all, "flats"] as const,
  flats: (params: PropertyFlatListParams) =>
    [...propertyQueryKeys.flatsRoot(), params] as const,
  flatDetails: (flatId: string) =>
    [...propertyQueryKeys.flatsRoot(), "details", flatId] as const,
  stats: () => [...propertyQueryKeys.all, "stats"] as const,
}

export const useCurrentPropertyApartmentQuery = () => {
  return useQuery({
    queryKey: propertyQueryKeys.apartment(),
    queryFn: getCurrentPropertyApartment,
    staleTime: 5 * 60 * 1000,
  })
}

export const usePropertyBlocksQuery = (
  params: PropertyBlockListParams = {}
) => {
  return useQuery({
    queryKey: propertyQueryKeys.blocks(params),
    queryFn: () => getPropertyBlocks(params),
    staleTime: 5 * 60 * 1000,
  })
}

export const usePropertyFlatsQuery = (
  params: PropertyFlatListParams = {}
) => {
  return useQuery({
    queryKey: propertyQueryKeys.flats(params),
    queryFn: () => getPropertyFlats(params),
    staleTime: 60 * 1000,
  })
}

export const usePropertyFlatDetailsQuery = (
  flatId: string | null,
  enabled = true
) => {
  return useQuery({
    queryKey: propertyQueryKeys.flatDetails(flatId ?? ""),
    queryFn: () => getPropertyFlatById(flatId!),
    enabled: Boolean(flatId) && enabled,
    staleTime: 60 * 1000,
  })
}

export const usePropertyStatsQuery = () => {
  return useQuery({
    queryKey: propertyQueryKeys.stats(),
    queryFn: getPropertyStats,
    staleTime: 60 * 1000,
  })
}

export const useCreatePropertyBlockMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePropertyBlockInput) => createPropertyBlock(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.blocksRoot(),
      })
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.apartment(),
      })
    },
  })
}

export const useUpdatePropertyBlockMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      blockId,
      input,
    }: {
      blockId: string
      input: UpdatePropertyBlockInput
    }) => updatePropertyBlock({ blockId, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.blocksRoot(),
      })
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.stats(),
      })
    },
  })
}

export const useDeactivatePropertyBlockMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivatePropertyBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.blocksRoot(),
      })
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.stats(),
      })
    },
  })
}

export const useCreatePropertyFlatMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePropertyFlatInput) => createPropertyFlat(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.flatsRoot(),
      })
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.stats(),
      })
    },
  })
}

export const useUpdatePropertyFlatMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      flatId,
      input,
    }: {
      flatId: string
      input: UpdatePropertyFlatInput
    }) => updatePropertyFlat({ flatId, input }),
    onSuccess: (flat) => {
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.flatsRoot(),
      })
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.stats(),
      })
      queryClient.setQueryData(propertyQueryKeys.flatDetails(flat.id), flat)
    },
  })
}

export const useUpdatePropertyFlatStatusMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      flatId,
      input,
    }: {
      flatId: string
      input: UpdatePropertyFlatStatusInput
    }) => updatePropertyFlatStatus({ flatId, input }),
    onSuccess: (flat) => {
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.flatsRoot(),
      })
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.stats(),
      })
      queryClient.setQueryData(propertyQueryKeys.flatDetails(flat.id), flat)
    },
  })
}

export const useGeneratePropertyFlatsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: GeneratePropertyFlatsInput) =>
      generatePropertyFlats(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.flatsRoot(),
      })
      queryClient.invalidateQueries({
        queryKey: propertyQueryKeys.stats(),
      })
    },
  })
}
