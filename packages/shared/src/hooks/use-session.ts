"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { creatorApi, fetchPublicConfig } from "../lib/api/endpoints";
import type { LoginInput } from "../lib/api/endpoints";
import { queryKeys } from "../lib/api/keys";
import { isLoginChallenge } from "../lib/types";
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
    onSuccess: (result) => {
      if (isLoginChallenge(result)) return;
      queryClient.setQueryData<SessionPayload>(queryKeys.session, result);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}

export function useTotpChallengeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { challengeToken: string; code: string }) => creatorApi.totpChallenge(input),
    onSuccess: (session) => {
      queryClient.setQueryData<SessionPayload>(queryKeys.session, session);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}

export function useTotpEnrollMutation() {
  return useMutation({ mutationFn: creatorApi.totpEnroll });
}

export function useTotpActivateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => creatorApi.totpActivate(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useTotpDisableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => creatorApi.totpDisable(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({ mutationFn: (email: string) => creatorApi.requestPasswordReset(email) });
}

export function useConfirmPasswordResetMutation() {
  return useMutation({
    mutationFn: (input: { token: string; newPassword: string }) =>
      creatorApi.confirmPasswordReset(input),
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.storage });
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

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => creatorApi.deleteAccount(password),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.session, null);
    },
  });
}

export type { PublicConfig };
