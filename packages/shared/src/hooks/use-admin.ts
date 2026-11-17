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
import type { AdminContact, LimitsSettings, Workspace } from "../lib/types";

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
  return useQuery({ queryKey: queryKeys.admin.models, queryFn: () => cmsApi.models() });
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
    mutationFn: (input: {
      accountId: string;
      isActive?: boolean;
      cmsAccess?: boolean;
      defaultWorkspaceId?: string;
    }) =>
      cmsApi.updateAccount(input.accountId, {
        isActive: input.isActive,
        cmsAccess: input.cmsAccess,
        defaultWorkspaceId: input.defaultWorkspaceId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.accounts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaces });
    },
  });
}

export function useAddAccountWorkspacesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountId: string; workspaceIds: string[] }) =>
      cmsApi.addAccountWorkspaces(input.accountId, input.workspaceIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.accounts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaces });
    },
  });
}

export function useRemoveAccountWorkspaceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountId: string; workspaceId: string }) =>
      cmsApi.removeAccountWorkspace(input.accountId, input.workspaceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.accounts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaces });
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
        modelsPath: input.modelsPath,
        supportsVideoInput: input.supportsVideoInput,
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
        displayName: input.displayName,
        providerModelId: input.providerModelId,
        inputCapabilities: input.inputCapabilities,
        outputCapabilities: input.outputCapabilities,
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

export function useAdminModelsFilteredQuery(filters: {
  providerId?: string;
  input?: "TEXT" | "IMAGE" | "VIDEO";
  output?: "TEXT" | "IMAGE" | "VIDEO";
  q?: string;
  active?: boolean;
}) {
  return useQuery({
    queryKey: [...queryKeys.admin.models, filters],
    queryFn: () => cmsApi.models(filters),
  });
}

export function useSyncProviderModelsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) => cmsApi.syncProviderModels(providerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.providers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.models });
      void queryClient.invalidateQueries({ queryKey: queryKeys.models });
    },
  });
}

export function useRemoteModelsQuery(providerId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.admin.providers, "remote", providerId],
    queryFn: () => cmsApi.remoteModels(providerId ?? ""),
    enabled: providerId !== null,
  });
}

export function useDeleteProviderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) => cmsApi.deleteProvider(providerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.providers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.models });
    },
  });
}

export function useAdminStorageSettingsQuery() {
  return useQuery({ queryKey: queryKeys.admin.storage, queryFn: cmsApi.storageSettings });
}

export function useAdminStorageUsageQuery() {
  return useQuery({ queryKey: queryKeys.admin.storageUsage, queryFn: cmsApi.storageUsage });
}

export function useUpdateStorageSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof cmsApi.updateStorageSettings>[0]) =>
      cmsApi.updateStorageSettings(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.storage });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.storageUsage });
    },
  });
}

export function useTestStorageMutation() {
  return useMutation({
    mutationFn: (driver: "local" | "s3") => cmsApi.testStorage(driver),
  });
}

export function useAdminMailSettingsQuery() {
  return useQuery({ queryKey: queryKeys.admin.mail, queryFn: cmsApi.mailSettings });
}

export function useLimitsSettingsQuery() {
  return useQuery({ queryKey: queryKeys.admin.limits, queryFn: cmsApi.limits });
}

export function useUpdateLimitsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LimitsSettings) => cmsApi.updateLimits(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.limits });
      void queryClient.invalidateQueries({ queryKey: queryKeys.config });
    },
  });
}

export function useUpdateMailSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof cmsApi.updateMailSettings>[0]) =>
      cmsApi.updateMailSettings(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.mail });
    },
  });
}

export function useTestMailMutation() {
  return useMutation({
    mutationFn: (to: string) => cmsApi.testMail(to),
  });
}

export function useAdminOrdersQuery() {
  return useQuery({ queryKey: queryKeys.admin.orders, queryFn: cmsApi.orders });
}

export function useMarkOrderPaidMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cmsApi.markOrderPaid(orderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaces });
    },
  });
}

export function useAdminAuditLogsQuery() {
  return useQuery({ queryKey: queryKeys.admin.audit, queryFn: () => cmsApi.auditLogs() });
}
