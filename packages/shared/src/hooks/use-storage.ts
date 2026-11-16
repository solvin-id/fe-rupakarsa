"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { creatorApi } from "../lib/api/endpoints";
import type { StorageFilters } from "../lib/api/endpoints";
import { queryKeys } from "../lib/api/keys";
import type { StorageList } from "../lib/types";

export function useStorageQuery(filters: StorageFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.storageList(filters),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      creatorApi.storage({ ...filters, cursor: pageParam ?? undefined }),
    getNextPageParam: (last: StorageList) => last.nextCursor,
  });
}

export function useDeleteAssetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => creatorApi.deleteAsset(assetId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.storage });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}
