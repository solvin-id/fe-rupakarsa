"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cmsApi } from "../lib/api/endpoints";
import type {
  CreateAccountInput,
  CreateAdminWorkspaceInput,
  CreateModelInput,
  CreateProviderInput,
  UpdateModelInput,
  UpdateProviderInput,
} from "../lib/api/endpoints";
import { queryKeys } from "../lib/api/keys";
import type { AdminContact, Workspace } from "../lib/types";

export function useAdminAccountsQuery() {
  return useQuery({ queryKey: queryKeys.admin.accounts, queryFn: cmsApi.accounts });
}

export function useAdminWorkspacesQuery() {
  return useQuery({ queryKey: queryKeys.admin.workspaces, queryFn: cmsApi.workspaces });
}

export function useAdminProvidersQuery() {
  return useQuery({ queryKey: queryKeys.admin.providers, queryFn: cmsApi.providers });
}

export function useAdminModelsQuery() {
  return useQuery({ queryKey: queryKeys.admin.models, queryFn: cmsApi.models });
}

export function useAdminModelTemplatesQuery(providerCode: string) {
  return useQuery({
    queryKey: queryKeys.admin.templates(providerCode),
    queryFn: () => cmsApi.modelTemplates(providerCode.length > 0 ? providerCode : undefined),
  });
}

export function useAdminContactQuery() {
  return useQuery({ queryKey: queryKeys.admin.contact, queryFn: cmsApi.contact });
}

export function useCreateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => cmsApi.createAccount(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.accounts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaces });
    },
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountId: string; isActive?: boolean; cmsAccess?: boolean }) =>
      cmsApi.updateAccount(input.accountId, { isActive: input.isActive, cmsAccess: input.cmsAccess }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.accounts });
    },
  });
}

export function useCreateAdminWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminWorkspaceInput) => cmsApi.createWorkspace(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaces });
    },
  });
}

export function useUpdateAdminWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; name?: string; isActive?: boolean }) =>
      cmsApi.updateWorkspace(input.workspaceId, { name: input.name, isActive: input.isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaces });
    },
  });
}

export function useTopUpWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; tokens: number; plan: number }) =>
      cmsApi.topUpWorkspace(input.workspaceId, { tokens: input.tokens, plan: input.plan }),
    onSuccess: (workspace: Workspace) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaces });
      void queryClient.setQueryData<{ workspaces: Workspace[] } | undefined>(
        queryKeys.admin.workspaces,
        (current) =>
          current
            ? {
                ...current,
                workspaces: current.workspaces.map((row) => (row.id === workspace.id ? workspace : row)),
              }
            : current,
      );
    },
  });
}

export function useCreateProviderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProviderInput) => cmsApi.createProvider(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.providers });
    },
  });
}

export function useUpdateProviderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { providerId: string } & UpdateProviderInput) =>
      cmsApi.updateProvider(input.providerId, {
        name: input.name,
        baseUrl: input.baseUrl,
        apiKey: input.apiKey,
        isActive: input.isActive,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.providers });
    },
  });
}

export function useTestProviderMutation() {
  return useMutation({
    mutationFn: (providerId: string) => cmsApi.testProvider(providerId),
  });
}

export function useCreateModelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateModelInput) => cmsApi.createModel(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.models });
    },
  });
}

export function useUpdateModelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { modelId: string } & UpdateModelInput) =>
      cmsApi.updateModel(input.modelId, {
        tokenCost: input.tokenCost,
        allowedParams: input.allowedParams,
        isActive: input.isActive,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.models });
    },
  });
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminContact) => cmsApi.updateContact(input),
    onSuccess: (contact) => {
      queryClient.setQueryData(queryKeys.admin.contact, contact);
      void queryClient.invalidateQueries({ queryKey: queryKeys.config });
    },
  });
}
