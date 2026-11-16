"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";

import { ApiError } from "../lib/api/client";
import { queryKeys } from "../lib/api/keys";
import { purgeLegacyClientState } from "../lib/legacy-cleanup";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    purgeLegacyClientState();
    let queryClient: QueryClient | undefined;

    // A 401 anywhere means the session cookie is gone: rewriting the session query to null
    // makes both frames redirect to /login without per-component listeners.
    const handleError = (error: unknown): void => {
      if (error instanceof ApiError && error.status === 401) {
        queryClient?.setQueryData(queryKeys.session, null);
      }
    };

    queryClient = new QueryClient({
      queryCache: new QueryCache({ onError: handleError }),
      mutationCache: new MutationCache({ onError: handleError }),
      defaultOptions: {
        queries: {
          staleTime: 15_000,
          retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
          refetchOnWindowFocus: true,
        },
      },
    });

    return queryClient;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
