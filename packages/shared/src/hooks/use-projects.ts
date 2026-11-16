"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { creatorApi } from "../lib/api/endpoints";
import type { CreateGenerationInput, PlanGenerationInput } from "../lib/api/endpoints";
import { queryKeys } from "../lib/api/keys";
import type { SessionPayload } from "../lib/types";

export function useFoldersQuery() {
  return useQuery({ queryKey: queryKeys.folders, queryFn: creatorApi.folders });
}

export function useFolderGenerationsQuery(folderId: string | null) {
  return useQuery({
    queryKey: queryKeys.generations(folderId ?? "none"),
    queryFn: () => creatorApi.folderGenerations(folderId ?? ""),
    enabled: folderId !== null,
  });
}

export function useCreatorModelsQuery() {
  return useQuery({ queryKey: queryKeys.models, queryFn: creatorApi.models, staleTime: 60_000 });
}

export function useCreateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string }) => creatorApi.createFolder(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    },
  });
}

export function useRenameFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { folderId: string; name: string; description?: string }) =>
      creatorApi.updateFolder(input.folderId, {
        name: input.name,
        description: input.description,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    },
  });
}

export function useDeleteFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => creatorApi.deleteFolder(folderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    },
  });
}

export function usePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlanGenerationInput) => creatorApi.planGeneration(input),
    onSuccess: (data) => {
      queryClient.setQueryData<SessionPayload | null>(queryKeys.session, (current) =>
        current ? { ...current, workspace: data.workspace } : current,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useGenerateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGenerationInput) => creatorApi.createGeneration(input),
    onSuccess: (data) => {
      queryClient.setQueryData<SessionPayload | null>(queryKeys.session, (current) =>
        current ? { ...current, workspace: data.workspace } : current,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.generations(data.generation.folderId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}

export function useGenerationQuery(
  generationId: string | null,
  options: { refetchInterval: number | false },
) {
  return useQuery({
    queryKey: queryKeys.generation(generationId ?? "none"),
    queryFn: () => creatorApi.generation(generationId ?? ""),
    enabled: generationId !== null,
    refetchInterval: options.refetchInterval,
  });
}

export function useDeleteGenerationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { generationId: string; folderId: string }) =>
      creatorApi.deleteGeneration(input.generationId),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.generations(input.folderId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    },
  });
}

export function useUploadReferenceMutation() {
  return useMutation({
    mutationFn: (file: File) => creatorApi.uploadReference(file),
  });
}
