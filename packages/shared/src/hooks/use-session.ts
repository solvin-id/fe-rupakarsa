"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { creatorApi, fetchPublicConfig } from "../lib/api/endpoints";
import type { LoginInput } from "../lib/api/endpoints";
import { queryKeys } from "../lib/api/keys";
import type { PublicConfig, SessionPayload } from "../lib/types";

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: creatorApi.session,
    retry: false,
  });
}

export function usePublicConfigQuery() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: fetchPublicConfig,
    staleTime: 5 * 60_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => creatorApi.login(input),
    onSuccess: (session) => {
      queryClient.setQueryData<SessionPayload>(queryKeys.session, session);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creatorApi.logout,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, null);
    },
  });
}

export function useSwitchWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => creatorApi.activateWorkspace(workspaceId),
    onSuccess: (session) => {
      queryClient.setQueryData<SessionPayload>(queryKeys.session, session);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      void queryClient.invalidateQueries({ queryKey: ["generations"] });
    },
  });
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      creatorApi.changePassword(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export type { PublicConfig };
