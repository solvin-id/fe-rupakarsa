"use client";

import { CheckCircle2, Copy, HardDrive, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";

import {
  useAdminStorageSettingsQuery,
  useAdminStorageUsageQuery,
  useTestStorageMutation,
  useUpdateStorageSettingsMutation,
} from "@rupakarsa/shared/hooks/use-admin";
import { formatTokens } from "@rupakarsa/shared/lib/format";
import type { StorageSettings } from "@rupakarsa/shared/lib/types";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Field, TextInput } from "@rupakarsa/shared/ui";

const DRIVER_OPTIONS: { value: "local" | "s3"; title: string; description: string }[] = [
  {
    value: "s3",
    title: "S3",
    description: "Bucket S3-compatible. Retensi otomatis berlaku untuk aset workspace.",
  },
  {
    value: "local",
    title: "Local",
    description: "Disk server tanpa retensi otomatis.",
  },
];

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** exponent;
  return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent] ?? "B"}`;
}

export function StorageView() {
  const settingsQuery = useAdminStorageSettingsQuery();
  const settings = settingsQuery.data;

  if (settingsQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (settingsQuery.isError || !settings) {
    return (
      <div className="animate-fade-up">
        <p className="text-sm text-danger">
          Gagal memuat pengaturan storage. Muat ulang halaman lalu coba lagi.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <header>
        <span className="mono-label text-accent-strong">Penyimpanan</span>
        <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Storage</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Driver global untuk workspace tanpa Google Drive. Aset yang sudah terhubung ke Drive
          workspace tidak memakai retensi global.
        </p>
      </header>

      <StorageUsageSummary />
      <StorageForm settings={settings} />
      <GoogleOAuthForm settings={settings} />

      <section className="mt-4 rounded-[1.75rem] border border-border bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
            <HardDrive className="size-4" aria-hidden />
          </span>
          <div>
            <p className="mono-label text-muted">Google Drive</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
              Drive per workspace
            </h2>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-muted">
          Aset workspace ber-Drive tidak memakai retensi global.
        </p>

        {settings.workspaces.length === 0 ? (
          <p className="mt-4 rounded-xl border border-border bg-surface-2/40 px-3 py-4 text-center text-xs text-muted">
            Belum ada workspace.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <div className="hidden grid-cols-[1fr_0.6fr_1fr_0.7fr_0.8fr] gap-3 border-b border-border bg-surface-2/40 px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-muted sm:grid">
              <span>Workspace</span>
              <span>Status</span>
              <span>Akun Google</span>
              <span>Folder</span>
              <span>Terhubung</span>
            </div>
            {settings.workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="grid gap-1 border-b border-border/60 px-4 py-2.5 text-[11px] last:border-b-0 sm:grid-cols-[1fr_0.6fr_1fr_0.7fr_0.8fr] sm:items-center sm:gap-3"
              >
                <span className="truncate text-xs font-medium text-ink">{workspace.name}</span>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    workspace.driveConnected
                      ? "bg-success/10 text-success"
                      : "bg-canvas-2 text-muted"
                  }`}
                >
                  {workspace.driveConnected ? "Terhubung" : "Belum"}
                </span>
                <span className="truncate text-[10px] text-muted">
                  {workspace.googleEmail || "—"}
                </span>
                {workspace.folderIdMasked ? (
                  <a
                    href={workspace.folderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-mono text-[10px] text-accent-strong underline-offset-2 hover:underline"
                  >
                    {workspace.folderIdMasked}
                  </a>
                ) : (
                  <span className="truncate font-mono text-[10px] text-muted">—</span>
                )}
                <span
                  className={`truncate text-[10px] ${
                    workspace.lastError ? "text-danger" : "text-muted"
                  }`}
                  title={workspace.lastError ?? undefined}
                >
                  {workspace.lastError ||
                    (workspace.connectedAt
                      ? new Date(workspace.connectedAt).toLocaleDateString("id-ID")
                      : "—")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StorageUsageSummary() {
  const usageQuery = useAdminStorageUsageQuery();
  const usage = usageQuery.data;

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {[
        { label: "Aset aktif", value: usage ? formatTokens(usage.active) : "…" },
        { label: "Total ukuran", value: usage ? formatBytes(usage.bytes) : "…" },
        { label: "Aset kedaluwarsa", value: usage ? formatTokens(usage.expired) : "…" },
      ].map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border bg-white/70 px-4 py-3.5"
        >
          <p className="text-lg font-semibold tracking-[-0.03em] text-ink">{item.value}</p>
          <p className="text-[10px] text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function StorageForm({ settings }: { settings: StorageSettings }) {
  const updateStorage = useUpdateStorageSettingsMutation();
  const testStorage = useTestStorageMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [driver, setDriver] = useState<"local" | "s3">(settings.driver);
  const [retentionDays, setRetentionDays] = useState(String(settings.retentionDays));
  const [endpoint, setEndpoint] = useState(settings.s3.endpoint);
  const [region, setRegion] = useState(settings.s3.region);
  const [bucket, setBucket] = useState(settings.s3.bucket);
  const [accessKeyId, setAccessKeyId] = useState(settings.s3.accessKeyId);
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [publicBaseUrl, setPublicBaseUrl] = useState(settings.s3.publicBaseUrl);
  const [forcePathStyle, setForcePathStyle] = useState(settings.s3.forcePathStyle);

  function handleSave(): void {
    const retention = Number(retentionDays);
    if (!Number.isInteger(retention) || retention < 0 || retention > 365) {
      pushToast("error", "Retensi harus angka 0–365 hari.");
      return;
    }
    updateStorage.mutate(
      {
        driver,
        retentionDays: retention,
        s3: {
          endpoint: endpoint.trim(),
          region: region.trim(),
          bucket: bucket.trim(),
          accessKeyId: accessKeyId.trim(),
          publicBaseUrl: publicBaseUrl.trim(),
          forcePathStyle,
          secretAccessKey: secretAccessKey.trim() || undefined,
        },
        // The OAuth client lives in its own card; resend it so saving this form never clears it.
        gdrive: { clientId: settings.gdrive.clientId, clientSecret: undefined },
      },
      {
        onSuccess: () => {
          setSecretAccessKey("");
          pushToast("success", "Pengaturan storage disimpan.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleTest(): void {
    testStorage.mutate(driver, {
      onSuccess: (result) => {
        pushToast(result.ok ? "success" : "error", result.message);
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  return (
    <section className="card mt-4 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <div>
          <p className="mono-label text-muted">Driver global</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
            Storage default
          </h2>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {DRIVER_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors ${
                driver === option.value
                  ? "border-accent/40 bg-accent-soft/40"
                  : "border-border bg-white"
              }`}
            >
              <input
                type="radio"
                name="storage-driver"
                checked={driver === option.value}
                onChange={() => setDriver(option.value)}
                className="mt-0.5 size-4 accent-[#d93e14]"
              />
              <span>
                <span className="block text-xs font-medium text-ink">{option.title}</span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label="Endpoint"
            htmlFor="storage-endpoint"
            hint="Contoh: https://s3.alist.example.com"
          >
            <TextInput
              id="storage-endpoint"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder="https://s3.example.com"
            />
          </Field>
          <Field label="Region" htmlFor="storage-region">
            <TextInput
              id="storage-region"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="auto"
            />
          </Field>
          <Field
            label="Bucket"
            htmlFor="storage-bucket"
            hint="Driver s3 baru aktif setelah bucket terisi; bila kosong sistem memakai local."
          >
            <TextInput
              id="storage-bucket"
              value={bucket}
              onChange={(event) => setBucket(event.target.value)}
              placeholder="rupakarsa-media"
            />
          </Field>
          <Field label="Access key ID" htmlFor="storage-access-key">
            <TextInput
              id="storage-access-key"
              value={accessKeyId}
              onChange={(event) => setAccessKeyId(event.target.value)}
              placeholder="Access key"
            />
          </Field>
          <Field label="Secret access key" htmlFor="storage-secret-key">
            <TextInput
              id="storage-secret-key"
              type="password"
              autoComplete="off"
              value={secretAccessKey}
              onChange={(event) => setSecretAccessKey(event.target.value)}
              placeholder="Kosongkan untuk mempertahankan"
            />
          </Field>
          <Field
            label="Public base URL"
            htmlFor="storage-public-base"
            hint="URL publik bucket untuk aset hasil render."
          >
            <TextInput
              id="storage-public-base"
              value={publicBaseUrl}
              onChange={(event) => setPublicBaseUrl(event.target.value)}
              placeholder="https://media.example.com"
            />
          </Field>
          <Field
            label="Retensi (hari)"
            htmlFor="storage-retention"
            hint="0 berarti tanpa retensi otomatis. Default 10 hari."
          >
            <TextInput
              id="storage-retention"
              type="number"
              min={0}
              max={365}
              value={retentionDays}
              onChange={(event) => setRetentionDays(event.target.value)}
            />
          </Field>
          <label className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-3">
            <input
              type="checkbox"
              checked={forcePathStyle}
              onChange={(event) => setForcePathStyle(event.target.checked)}
              className="mt-0.5 size-4 accent-[#d93e14]"
            />
            <span>
              <span className="block text-xs font-medium text-ink">Force path style</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Wajib untuk MinIO dan sebagian besar S3-compatible.
              </span>
            </span>
          </label>
        </div>

        {settings.s3.secretAccessKeyMasked ? (
          <p className="rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Secret tersimpan:{" "}
            <span className="font-mono text-ink">{settings.s3.secretAccessKeyMasked}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            loading={updateStorage.isPending}
            icon={<Save className="size-4" aria-hidden />}
            onClick={handleSave}
          >
            Simpan storage
          </Button>
          <Button
            variant="secondary"
            loading={testStorage.isPending}
            icon={<CheckCircle2 className="size-4" aria-hidden />}
            onClick={handleTest}
          >
            Test koneksi
          </Button>
        </div>
        <p className="flex items-start gap-2 text-[10px] leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
          Test koneksi memakai konfigurasi yang sudah tersimpan, bukan isian yang belum disimpan.
        </p>
      </div>
    </section>
  );
}

function GoogleOAuthForm({ settings }: { settings: StorageSettings }) {
  const updateStorage = useUpdateStorageSettingsMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [clientId, setClientId] = useState(settings.gdrive.clientId);
  const [clientSecret, setClientSecret] = useState("");
  const [copied, setCopied] = useState(false);

  function handleSave(): void {
    updateStorage.mutate(
      {
        driver: settings.driver,
        retentionDays: settings.retentionDays,
        s3: {
          endpoint: settings.s3.endpoint,
          region: settings.s3.region,
          bucket: settings.s3.bucket,
          accessKeyId: settings.s3.accessKeyId,
          publicBaseUrl: settings.s3.publicBaseUrl,
          forcePathStyle: settings.s3.forcePathStyle,
          secretAccessKey: undefined,
        },
        gdrive: {
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setClientSecret("");
          pushToast("success", "Konfigurasi Google OAuth disimpan.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleCopy(): void {
    void navigator.clipboard.writeText(settings.gdrive.redirectUri).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <section className="card mt-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
            <ShieldCheck className="size-4" aria-hidden />
          </span>
          <div>
            <p className="mono-label text-muted">OAuth client</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
              Google Drive (OAuth)
            </h2>
          </div>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9px] font-medium ${
            settings.gdrive.configured ? "bg-success/10 text-success" : "bg-canvas-2 text-muted"
          }`}
        >
          {settings.gdrive.configured ? "Terhubung" : "Belum dikonfigurasi"}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label="Client ID"
            htmlFor="gdrive-client-id"
            hint="Dari OAuth client tipe Web application di Google Cloud."
          >
            <TextInput
              id="gdrive-client-id"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
            />
          </Field>
          <Field label="Client Secret" htmlFor="gdrive-client-secret">
            <TextInput
              id="gdrive-client-secret"
              type="password"
              autoComplete="off"
              value={clientSecret}
              onChange={(event) => setClientSecret(event.target.value)}
              placeholder="Kosongkan untuk mempertahankan"
            />
          </Field>
        </div>

        <Field label="Redirect URI" htmlFor="gdrive-redirect-uri">
          <div className="flex items-center gap-2">
            <TextInput
              id="gdrive-redirect-uri"
              readOnly
              value={settings.gdrive.redirectUri}
              className="font-mono text-[11px]"
            />
            <Button
              variant="secondary"
              icon={<Copy className="size-4" aria-hidden />}
              onClick={handleCopy}
            >
              {copied ? "Tersalin" : "Salin"}
            </Button>
          </div>
        </Field>

        <p className="text-[10px] leading-relaxed text-muted">
          Tambahkan Redirect URI di atas ke Authorized redirect URIs pada OAuth client Google Cloud
          (tipe Web application). Setelah disimpan, setiap workspace menghubungkan Drive lewat layar
          consent Google.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            loading={updateStorage.isPending}
            icon={<Save className="size-4" aria-hidden />}
            onClick={handleSave}
          >
            Simpan Google OAuth
          </Button>
          {settings.gdrive.clientSecretMasked ? (
            <span className="text-[10px] text-muted">
              Secret tersimpan:{" "}
              <span className="font-mono text-ink">{settings.gdrive.clientSecretMasked}</span>
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
