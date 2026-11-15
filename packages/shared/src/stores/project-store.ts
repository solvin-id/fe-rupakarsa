"use client";

import { create } from "zustand";

import { SEED_FOLDERS, SEED_GENERATIONS } from "../lib/seed";
import { readJson, STORAGE_KEYS, writeJson } from "../lib/storage";
import type { Folder, Generation, User, WorkspaceSnapshot } from "../lib/types";

interface ProjectState {
  folders: Folder[];
  generations: Generation[];
  hydrated: boolean;
  hydrate: () => void;
  createFolder: (input: { name: string; description: string; user: User }) => Folder;
  renameFolder: (id: string, name: string, description: string) => void;
  deleteFolder: (id: string) => void;
  addGeneration: (generation: Generation) => void;
  updateGeneration: (id: string, patch: Partial<Generation>) => void;
  deleteGeneration: (id: string) => void;
  getFolder: (id: string) => Folder | undefined;
  getGenerations: (folderId: string) => Generation[];
}

function persist(folders: Folder[], generations: Generation[]): void {
  writeJson<WorkspaceSnapshot>(STORAGE_KEYS.workspace, { folders, generations });
}

function sortGenerations(items: Generation[]): Generation[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  folders: [],
  generations: [],
  hydrated: false,

  hydrate: () => {
    const stored = readJson<WorkspaceSnapshot | null>(STORAGE_KEYS.workspace, null);
    if (!stored?.folders || !stored?.generations) {
      set({
        folders: SEED_FOLDERS,
        generations: sortGenerations(SEED_GENERATIONS),
        hydrated: true,
      });
      return;
    }
    set({
      folders: stored.folders,
      generations: sortGenerations(stored.generations),
      hydrated: true,
    });
  },

  createFolder: ({ name, description, user }) => {
    const now = new Date().toISOString();
    const folder: Folder = {
      id: `fld_${crypto.randomUUID().slice(0, 8)}`,
      tenantId: user.tenantId,
      userId: user.id,
      name: name.trim(),
      description: description.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const folders = [folder, ...get().folders];
    persist(folders, get().generations);
    set({ folders });
    return folder;
  },

  renameFolder: (id, name, description) => {
    const folders = get().folders.map((folder) =>
      folder.id === id
        ? {
            ...folder,
            name: name.trim(),
            description: description.trim(),
            updatedAt: new Date().toISOString(),
          }
        : folder,
    );
    persist(folders, get().generations);
    set({ folders });
  },

  deleteFolder: (id) => {
    const folders = get().folders.filter((folder) => folder.id !== id);
    const generations = get().generations.filter((item) => item.folderId !== id);
    persist(folders, generations);
    set({ folders, generations });
  },

  addGeneration: (generation) => {
    const generations = sortGenerations([generation, ...get().generations]);
    const folders = get().folders.map((folder) =>
      folder.id === generation.folderId
        ? { ...folder, updatedAt: new Date().toISOString() }
        : folder,
    );
    persist(folders, generations);
    set({ folders, generations });
  },

  updateGeneration: (id, patch) => {
    const generations = sortGenerations(
      get().generations.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    const target = generations.find((item) => item.id === id);
    const folders = target
      ? get().folders.map((folder) =>
          folder.id === target.folderId
            ? { ...folder, updatedAt: new Date().toISOString() }
            : folder,
        )
      : get().folders;
    persist(folders, generations);
    set({ folders, generations });
  },

  deleteGeneration: (id) => {
    const generations = get().generations.filter((item) => item.id !== id);
    persist(get().folders, generations);
    set({ generations });
  },

  getFolder: (id) => get().folders.find((folder) => folder.id === id),

  getGenerations: (folderId) =>
    sortGenerations(get().generations.filter((item) => item.folderId === folderId)),
}));
