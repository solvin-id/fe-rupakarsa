"use client";

import { ArrowDown, ArrowUp, Activity, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  useAdminModelsQuery,
  useAdminProvidersQuery,
  useAdminWorkspacesQuery,
  useAiActivityQuery,
} from "@rupakarsa/shared/hooks/use-admin";
import { formatDateTime, formatRelative, formatTokens } from "@rupakarsa/shared/lib/format";
import type {
  AiActivity,
  AiActivityFilters,
  AiActivityKind,
  AiActivityOrderBy,
  AiActivityStatus,
} from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Select, TextInput } from "@rupakarsa/shared/ui";

const CREATOR_URL = process.env.NEXT_PUBLIC_CREATOR_URL ?? "http://localhost:3000";
const PAGE_SIZES = ["10", "25", "50", "100"];
const DATE_COLUMNS: { key: AiActivityOrderBy; label: string }[] = [
  { key: "createdAt", label: "Waktu" },
  { key: "latencyMs", label: "Latency" },
  { key: "tokensUsed", label: "Token" },
];

const KIND_OPTIONS: AiActivityKind[] = [
  "PLAN",
  "ANALYSIS",
  "COMPRESS",
  "RENDER_SUBMIT",
  "RENDER_STATUS",
  "RENDER_COMPLETE",
  "RENDER_FAIL",
  "MODEL_SYNC",
  "PROVIDER_TEST",
  "CHARACTER_TRAIN",
];

const STATUS_STYLES: Record<AiActivityStatus, string> = {
  SUCCESS: "bg-success/10 text-success",
  ERROR: "bg-danger/10 text-danger",
  PENDING: "bg-warning/10 text-warning",
};

const GRID = "lg:grid-cols-[1.1fr_0.9fr_0.7fr_1.2fr_0.9fr_0.9fr_0.6fr_0.6fr_0.5fr]";

/** `type="date"` is local-date; the API filters on UTC instants. */
function dayStart(value: string): string | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
}

function dayEnd(value: string): string | undefined {
  return value ? new Date(`${value}T23:59:59.999Z`).toISOString() : undefined;
}

export function AiActivityView() {
  const pushToast = useUiStore((state) => state.pushToast);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [orderBy, setOrderBy] = useState<AiActivityOrderBy>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [selected, setSelected] = useState<AiActivity | null>(null);

  const providersQuery = useAdminProvidersQuery();
  const modelsQuery = useAdminModelsQuery();
  const workspacesQuery = useAdminWorkspacesQuery();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // A new search is a new result set; keeping the page would show an empty page two.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filters = useMemo<AiActivityFilters>(
    () => ({
      page,
      limit,
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      ...(kind ? { kind: kind as AiActivityKind } : {}),
      ...(status ? { status: status as AiActivityStatus } : {}),
      ...(providerId ? { providerId } : {}),
      ...(modelId ? { modelId } : {}),
      ...(workspaceId ? { workspaceId } : {}),
      ...(mediaType ? { mediaType: mediaType === "VIDEO" ? "VIDEO" : "IMAGE" } : {}),
      ...(from ? { from: dayStart(from) } : {}),
      ...(to ? { to: dayEnd(to) } : {}),
      orderBy,
      order,
    }),
    [
      page,
      limit,
      debouncedSearch,
      kind,
      status,
      providerId,
      modelId,
      workspaceId,
      mediaType,
      from,
      to,
      orderBy,
      order,
    ],
  );

  const activityQuery = useAiActivityQuery(filters);

  useEffect(() => {
    if (!activityQuery.isError) return;
    pushToast("error", activityQuery.error.message);
  }, [activityQuery.isError, activityQuery.error, pushToast]);

  const data = activityQuery.data;
  const rows = data?.rows ?? [];
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  function update(setter: (value: string) => void, value: string): void {
    setter(value);
    setPage(1);
  }

  function toggleSort(next: AiActivityOrderBy): void {
    if (orderBy === next) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(next);
      setOrder("desc");
    }
    setPage(1);
  }

  return (
    <div className="animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label text-muted">Observability</p>
          <h1 className="display mt-2 text-[clamp(1.8rem,3vw,2.6rem)] text-ink">AI activity</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Setiap permintaan AI dan peristiwa render dicatat di sini: plan, analisis, kompresi,
            submit provider, dan hasil akhir. Hanya terlihat dari CMS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="pill">{formatTokens(data?.stats.total ?? 0)} entri</span>
          <span className="pill text-success">{formatTokens(data?.stats.success ?? 0)} sukses</span>
          <span className="pill text-danger">{formatTokens(data?.stats.error ?? 0)} gagal</span>
          <span className="pill">rata-rata {formatTokens(data?.stats.avgLatencyMs ?? 0)} ms</span>
        </div>
      </header>

      <section className="card mt-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative block">
            <span className="mono-label text-[9px] text-muted">Cari</span>
            <Search className="pointer-events-none absolute bottom-2.5 left-3 size-3.5 text-muted" aria-hidden />
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Model, error, job id…"
              className="mt-1 pl-9"
              aria-label="Cari aktivitas"
            />
          </label>

          <div>
            <span className="mono-label text-[9px] text-muted">Jenis</span>
            <Select
              className="mt-1"
              value={kind}
              onChange={(value) => update(setKind, value)}
              options={[{ value: "", label: "Semua jenis" }, ...KIND_OPTIONS.map((item) => ({ value: item, label: item }))]}
            />
          </div>

          <div>
            <span className="mono-label text-[9px] text-muted">Status</span>
            <Select
              className="mt-1"
              value={status}
              onChange={(value) => update(setStatus, value)}
              options={[
                { value: "", label: "Semua status" },
                { value: "SUCCESS", label: "SUCCESS" },
                { value: "ERROR", label: "ERROR" },
                { value: "PENDING", label: "PENDING" },
              ]}
            />
          </div>

          <div>
            <span className="mono-label text-[9px] text-muted">Tipe media</span>
            <Select
              className="mt-1"
              value={mediaType}
              onChange={(value) => update(setMediaType, value)}
              options={[
                { value: "", label: "Semua tipe" },
                { value: "VIDEO", label: "VIDEO" },
                { value: "IMAGE", label: "IMAGE" },
              ]}
            />
          </div>

          <div>
            <span className="mono-label text-[9px] text-muted">Provider</span>
            <Select
              className="mt-1"
              value={providerId}
              onChange={(value) => update(setProviderId, value)}
              options={[
                { value: "", label: "Semua provider" },
                ...(providersQuery.data ?? []).map((provider) => ({
                  value: provider.id,
                  label: provider.name,
                })),
              ]}
            />
          </div>

          <div>
            <span className="mono-label text-[9px] text-muted">Model</span>
            <Select
              className="mt-1"
              value={modelId}
              onChange={(value) => update(setModelId, value)}
              options={[
                { value: "", label: "Semua model" },
                ...(modelsQuery.data ?? []).map((model) => ({
                  value: model.id,
                  label: model.displayName,
                })),
              ]}
            />
          </div>

          <div>
            <span className="mono-label text-[9px] text-muted">Workspace</span>
            <Select
              className="mt-1"
              value={workspaceId}
              onChange={(value) => update(setWorkspaceId, value)}
              options={[
                { value: "", label: "Semua workspace" },
                ...(workspacesQuery.data?.workspaces ?? []).map((workspace) => ({
                  value: workspace.id,
                  label: workspace.name,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mono-label text-[9px] text-muted">Dari</span>
              <TextInput
                type="date"
                className="mt-1"
                value={from}
                onChange={(event) => update(setFrom, event.target.value)}
                aria-label="Dari tanggal"
              />
            </label>
            <label className="block">
              <span className="mono-label text-[9px] text-muted">Sampai</span>
              <TextInput
                type="date"
                className="mt-1"
                value={to}
                onChange={(event) => update(setTo, event.target.value)}
                aria-label="Sampai tanggal"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="card mt-4 overflow-hidden">
        <div
          className={`hidden ${GRID} gap-3 border-b border-border bg-surface-2/40 px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-muted lg:grid`}
        >
          {DATE_COLUMNS.map((column) => (
            <button
              key={column.key}
              type="button"
              onClick={() => toggleSort(column.key)}
              className={`flex items-center gap-1 text-left ${
                orderBy === column.key ? "text-ink" : ""
              }`}
            >
              {column.label}
              {orderBy === column.key ? (
                order === "asc" ? (
                  <ArrowUp className="size-3" aria-hidden />
                ) : (
                  <ArrowDown className="size-3" aria-hidden />
                )
              ) : null}
            </button>
          ))}
          <span>Jenis</span>
          <span>Status</span>
          <span>Model</span>
          <span>Provider</span>
          <span>Workspace</span>
          <span>Aksi</span>
        </div>

        {activityQuery.isPending ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <Activity className="size-6 text-muted" aria-hidden />
            <p className="text-sm font-medium text-ink">Belum ada aktivitas AI</p>
            <p className="text-xs text-muted">Jalankan plan atau render untuk mengisi log ini.</p>
          </div>
        ) : (
          <ul>
            {rows.map((row) => (
              <li key={row.id} className="border-b border-border/60 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className={`grid w-full gap-1 px-4 py-3 text-left text-[11px] transition-colors hover:bg-surface-2/40 ${GRID} lg:items-center lg:gap-3`}
                >
                  <span className="text-ink">
                    {formatDateTime(row.createdAt)}
                    <span className="ml-2 text-[9px] text-muted">{formatRelative(row.createdAt)}</span>
                  </span>
                  <span className="font-mono tabular-nums text-ink">{formatTokens(row.latencyMs)} ms</span>
                  <span className="font-mono tabular-nums text-ink">{formatTokens(row.tokensUsed)}</span>
                  <span className="mono-label text-[9px] text-accent-strong">{row.kind}</span>
                  <span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${STATUS_STYLES[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </span>
                  <span className="truncate text-ink">{row.modelName || "—"}</span>
                  <span className="truncate text-muted">{row.providerName ?? "—"}</span>
                  <span className="truncate text-muted">{row.workspaceName ?? "—"}</span>
                  <span className="text-accent-strong">Detail</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-[11px] text-muted">
            Halaman {data?.page ?? page} dari {pages} · {formatTokens(data?.total ?? 0)} entri
          </p>
          <div className="flex items-center gap-2">
            <div className="w-28">
              <Select
                value={String(limit)}
                onChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
                options={PAGE_SIZES.map((size) => ({ value: size, label: `${size} / hal` }))}
                aria-label="Ukuran halaman"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
            >
              Next
            </Button>
          </div>
        </footer>
      </section>

      <Dialog
        open={Boolean(selected)}
        title={selected ? `${selected.kind} · ${selected.status}` : "Aktivitas"}
        description={selected ? formatDateTime(selected.createdAt) : undefined}
        onClose={() => setSelected(null)}
        widthClassName="max-w-3xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Tutup
            </Button>
            {selected?.folderId && selected.generationId ? (
              <a
                href={`${CREATOR_URL}/app/projects/${selected.folderId}?generation=${selected.generationId}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="primary">Buka render</Button>
              </a>
            ) : null}
          </>
        }
      >
        {selected ? (
          <div className="flex flex-col gap-3 text-[11px]">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Model", value: selected.modelName || "—" },
                { label: "Provider", value: selected.providerName ?? "—" },
                { label: "Workspace", value: selected.workspaceName ?? "—" },
                { label: "Latency", value: `${formatTokens(selected.latencyMs)} ms` },
                { label: "Prompt", value: `${formatTokens(selected.promptChars)} kar` },
                { label: "Respons", value: `${formatTokens(selected.responseChars)} kar` },
                { label: "Token", value: formatTokens(selected.tokensUsed) },
                { label: "Job", value: selected.externalJobId ?? "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface-2/50 px-3 py-2">
                  <p className="mono-label text-[8px] text-muted">{item.label}</p>
                  <p className="mt-0.5 truncate font-medium text-ink">{item.value}</p>
                </div>
              ))}
            </div>

            {selected.errorMessage ? (
              <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
                <p className="mono-label text-[8px] text-danger">Error</p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink">
                  {selected.errorCode ? `${selected.errorCode}: ` : ""}
                  {selected.errorMessage}
                </p>
              </div>
            ) : null}

            <div>
              <p className="mono-label text-muted">Request</p>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2/50 p-3 font-mono text-[10px] leading-relaxed text-ink">
                {selected.requestText || "—"}
              </pre>
            </div>

            <div>
              <p className="mono-label text-muted">Response</p>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2/50 p-3 font-mono text-[10px] leading-relaxed text-ink">
                {selected.responseText || "—"}
              </pre>
            </div>

            <div>
              <p className="mono-label text-muted">Metadata</p>
              <pre className="mt-1 max-h-48 overflow-auto rounded-xl border border-border bg-surface-2/50 p-3 font-mono text-[10px] leading-relaxed text-ink">
                {JSON.stringify(selected.metadata, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
