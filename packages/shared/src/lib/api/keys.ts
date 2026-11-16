export const queryKeys = {
  session: ["session"] as const,
  config: ["config"] as const,
  workspaces: ["workspaces"] as const,
  members: (workspaceId: string) => ["members", workspaceId] as const,
  folders: ["folders"] as const,
  generations: (folderId: string) => ["generations", folderId] as const,
  generation: (id: string) => ["generation", id] as const,
  models: ["models"] as const,
  admin: {
    accounts: ["admin", "accounts"] as const,
    workspaces: ["admin", "workspaces"] as const,
    providers: ["admin", "providers"] as const,
    models: ["admin", "models"] as const,
    templates: (providerCode: string) => ["admin", "templates", providerCode] as const,
    contact: ["admin", "contact"] as const,
  },
};
