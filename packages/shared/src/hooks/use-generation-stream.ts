"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { API_BASE_URL } from "../lib/api/client";
import { creatorApi } from "../lib/api/endpoints";
import { queryKeys } from "../lib/api/keys";
import type { ActiveGeneration, Generation } from "../lib/types";
import { useGenerationStore } from "../stores/generation-store";

/** Flip to false to run the bell on polling only; every other behaviour is unchanged. */
const USE_SSE = true;
/** Heartbeats arrive every 10 s, so this is three missed beats. */
const WATCHDOG_MS = 25_000;
const POLL_INTERVAL_MS = 3_000;

export function useActiveGenerationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.activeGenerations,
    queryFn: creatorApi.activeGenerations,
    enabled,
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
  });
}

/**
 * Feeds the notification bell from `GET /generations/stream`. A proxy that buffers the stream, an
 * `EventSource` error, or an unanswered stream all fall back to 3 s polling, so the feature works
 * without server-side tuning.
 */
export function useGenerationStream(workspaceId: string | null): void {
  const setSnapshot = useGenerationStore((state) => state.setSnapshot);
  const finish = useGenerationStore((state) => state.finish);
  const setStreamMode = useGenerationStore((state) => state.setStreamMode);
  const reset = useGenerationStore((state) => state.reset);
  const streamMode = useGenerationStore((state) => state.streamMode);

  const polling = useActiveGenerationsQuery(streamMode === "polling" && workspaceId !== null);

  /** Any id that left the active set is finished: fetch it once so the alert carries the outcome. */
  const applySnapshot = (rows: ActiveGeneration[]): void => {
    const previous = useGenerationStore.getState().jobs;
    const nextIds = new Set(rows.map((row) => row.id));
    const vanished = Object.keys(previous).filter((id) => !nextIds.has(id));
    setSnapshot(rows);
    for (const id of vanished) {
      creatorApi
        .generation(id)
        .then((generation: Generation) => finish(generation))
        .catch(() => undefined);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    reset();

    let cancelled = false;
    creatorApi
      .activeGenerations()
      .then((rows) => {
        if (!cancelled) setSnapshot(rows);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [workspaceId, reset, setSnapshot]);

  useEffect(() => {
    if (!workspaceId) return;
    if (!USE_SSE || typeof EventSource === "undefined") {
      setStreamMode("polling");
      return;
    }

    const source = new EventSource(`${API_BASE_URL}/api/creator/generations/stream`, {
      withCredentials: true,
    });
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    const degrade = (): void => {
      source.close();
      setStreamMode("polling");
    };
    const armWatchdog = (): void => {
      clearTimeout(watchdog);
      watchdog = setTimeout(degrade, WATCHDOG_MS);
    };

    source.addEventListener("open", () => {
      setStreamMode("live");
      armWatchdog();
    });
    source.addEventListener("generations", (event) => {
      armWatchdog();
      try {
        applySnapshot(JSON.parse((event as MessageEvent<string>).data) as ActiveGeneration[]);
      } catch {
        // A malformed frame is dropped; the next snapshot replaces it two seconds later.
      }
    });
    source.addEventListener("finished", (event) => {
      armWatchdog();
      try {
        finish(JSON.parse((event as MessageEvent<string>).data) as Generation);
      } catch {
        // Ignore: the disappearance check on the next snapshot retries the same finish.
      }
    });
    source.addEventListener("heartbeat", armWatchdog);
    source.addEventListener("error", degrade);

    return () => {
      clearTimeout(watchdog);
      source.close();
    };
  }, [workspaceId, finish, setStreamMode]);

  useEffect(() => {
    if (polling.data) applySnapshot(polling.data);
    // `applySnapshot` is intentionally out of the dependency list: it only depends on store state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling.data]);
}
