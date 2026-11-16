"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { creatorApi } from "../lib/api/endpoints";
import { queryKeys } from "../lib/api/keys";

function useWorkspaceInvalidator() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    void queryClient.invalidateQueries({ queryKey: queryKeys.session });
  };
}

export function useWorkspacesQuery() {
  return useQuery({ queryKey: queryKeys.workspaces, queryFn: creatorApi.workspaces });
}

export function useWorkspaceMembersQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: queryKeys.members(workspaceId ?? "none"),
    queryFn: () => creatorApi.members(workspaceId ?? ""),
    enabled: workspaceId !== null,
  });
}

export function useCreateWorkspaceMutation() {
  const invalidate = useWorkspaceInvalidator();
  return useMutation({
    mutationFn: (input: { name: string; slug?: string }) => creatorApi.createWorkspace(input),
    onSuccess: invalidate,
  });
}

export function useRenameWorkspaceMutation() {
  const invalidate = useWorkspaceInvalidator();
  return useMutation({
    mutationFn: (input: { workspaceId: string; name: string }) =>
      creatorApi.renameWorkspace(input.workspaceId, { name: input.name }),
    onSuccess: invalidate,
  });
}

export function useDeleteWorkspaceMutation() {
  const invalidate = useWorkspaceInvalidator();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => creatorApi.deleteWorkspace(workspaceId),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    },
  });
}

export function useLeaveWorkspaceMutation() {
  const invalidate = useWorkspaceInvalidator();
  return useMutation({
    mutationFn: (workspaceId: string) => creatorApi.leaveWorkspace(workspaceId),
    onSuccess: invalidate,
  });
}

export function useRequestJoinMutation() {
  const invalidate = useWorkspaceInvalidator();
  return useMutation({
    mutationFn: (input: { slug: string; message?: string }) => creatorApi.requestJoin(input),
    onSuccess: invalidate,
  });
}

export function useApproveJoinRequestMutation() {
  const invalidate = useWorkspaceInvalidator();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => creatorApi.approveJoinRequest(requestId),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRejectJoinRequestMutation() {
  const invalidate = useWorkspaceInvalidator();
  return useMutation({
    mutationFn: (requestId: string) => creatorApi.rejectJoinRequest(requestId),
    onSuccess: invalidate,
  });
}

export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; userId: string; role: "ADMIN" | "MEMBER" }) =>
      creatorApi.updateMemberRole(input.workspaceId, input.userId, input.role),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(input.workspaceId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; userId: string }) =>
      creatorApi.removeMember(input.workspaceId, input.userId),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(input.workspaceId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}
