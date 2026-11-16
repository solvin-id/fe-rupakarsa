"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { creatorApi } from "../lib/api/endpoints";
import { queryKeys } from "../lib/api/keys";

export function useBillingPackagesQuery() {
  return useQuery({
    queryKey: [...queryKeys.billing, "packages"],
    queryFn: creatorApi.billingPackages,
    staleTime: 60_000,
  });
}

export function useBillingOrdersQuery() {
  return useQuery({
    queryKey: [...queryKeys.billing, "orders"],
    queryFn: creatorApi.billingOrders,
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) => creatorApi.createOrder(packageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}
