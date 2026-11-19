"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  History,
  Mail,
  MessageCircle,
  Phone,
  Save,
  Settings,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

import {
  useAdminAuditLogsQuery,
  useAdminContactQuery,
  useAdminMailSettingsQuery,
  useAdminModelsFilteredQuery,
  useAdminProvidersQuery,
  useLimitsSettingsQuery,
  useTestMailMutation,
  useUpdateContactMutation,
  useUpdateLimitsMutation,
  useUpdateMailSettingsMutation,
} from "@rupakarsa/shared/hooks/use-admin";
import { apiRequest } from "@rupakarsa/shared/lib/api/client";
import type {
  AiModel,
  AdminContact,
  LimitsSettings,
  MailSettings,
  MediaCapability,
} from "@rupakarsa/shared/lib/types";
import { formatDateTime } from "@rupakarsa/shared/lib/format";
import { normalizeWhatsAppNumber, whatsappLink } from "@rupakarsa/shared/lib/whatsapp";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog, Field, Select, TextInput } from "@rupakarsa/shared/ui";

const AI_SETTINGS_KEY = ["admin", "settings", "ai"] as const;

interface AiSettingsPayload {
  planModelId: string | null;
  analysisModelId: string | null;
  videoAnalysisModelId: string | null;
  defaultVideoModelId: string | null;
}

function comparePlanModels(a: AiModel, b: AiModel): number {
  const score = (model: AiModel) =>
    model.inputCapabilities.filter((capability) =>
      (["TEXT", "IMAGE", "VIDEO"] as MediaCapability[]).includes(capability),
    ).length;
  return score(b) - score(a) || a.displayName.localeCompare(b.displayName);
}

function capabilityOptions(
  models: AiModel[],
  label: (model: AiModel) => string,
): { value: string; label: string }[] {
  return [
    {
      value: "",
      label:
        models.length === 0 ? "Sync provider dulu di menu Providers." : "Belum disetel",
    },
    ...models.map((model) => ({ value: model.id, label: label(model) })),
  ];
}

function SectionLoading() {
  return (
    <div className="flex min-h-24 items-center justify-center">
      <span className="size-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}

export function SettingsView() {
  const contactQuery = useAdminContactQuery();

  if (contactQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <SettingsForm
      contact={
        contactQuery.data ?? { name: "Tim Rupakarsa", whatsapp: "", email: "halo@rupakarsa.id" }
      }
    />
  );
}

function SettingsForm({ contact }: { contact: AdminContact }) {
  const updateContact = useUpdateContactMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [name, setName] = useState(contact.name);
  const [whatsapp, setWhatsapp] = useState(contact.whatsapp);
  const [email, setEmail] = useState(contact.email);

  const normalized = normalizeWhatsAppNumber(whatsapp);
  const previewLink = normalized
    ? whatsappLink(normalized, "Halo, saya ingin mengajukan akses Rupakarsa.")
    : null;

  function handleSave(event?: FormEvent): void {
    event?.preventDefault();
    if (name.trim().length < 2) {
      pushToast("error", "Nama admin minimal 2 karakter.");
      return;
    }
    if (normalized.length < 8 || normalized.length > 15) {
      pushToast("error", "Nomor WhatsApp harus 8–15 digit, contoh 6281234567890.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      pushToast("error", "Format email admin tidak valid.");
      return;
    }

    updateContact.mutate(
      { name: name.trim(), whatsapp: normalized, email: email.trim().toLowerCase() },
      {
        onSuccess: () => {
          pushToast(
            "success",
            "Kontak admin disimpan. Halaman request akses langsung memakai nomor ini.",
          );
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  return (
    <div className="animate-fade-up">
      <header>
        <span className="mono-label text-accent-strong">Konfigurasi</span>
        <h1 className="display mt-2 text-[clamp(2.2rem,4vw,3.4rem)] text-ink">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Atur model AI default, email keluar, kontak admin, dan audit aktivitas CMS.
        </p>
      </header>

      <div className="mt-5">
        <AiSettingsSection />
      </div>

      <div className="mt-4">
        <LimitsSettingsSection />
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent-soft/50 px-4 py-3.5">
        <MessageCircle className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden />
        <p className="text-xs leading-relaxed text-ink/70">
          <span className="font-medium text-ink">Nomor WhatsApp admin dipakai untuk request akses.</span>{" "}
          Gunakan format internasional tanpa tanda plus, misalnya{" "}
          <span className="font-mono text-ink">6281234567890</span>.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
              <Phone className="size-4" aria-hidden />
            </span>
            <div>
              <p className="mono-label text-muted">Kontak admin</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                Tujuan request akses
              </h2>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-5 flex flex-col gap-4">
            <Field label="Nama admin" htmlFor="admin-name">
              <TextInput
                id="admin-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Tim Rupakarsa"
              />
            </Field>
            <Field
              label="Nomor WhatsApp"
              htmlFor="admin-whatsapp"
              hint="Format internasional tanpa +, contoh 6281234567890."
            >
              <TextInput
                id="admin-whatsapp"
                inputMode="tel"
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="6281234567890"
              />
            </Field>
            <Field
              label="Email admin"
              htmlFor="admin-email"
              hint="Dipakai sebagai fallback jika WhatsApp tidak tersedia."
            >
              <TextInput
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="halo@rupakarsa.id"
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-1 w-full"
              loading={updateContact.isPending}
              icon={<Save className="size-4" aria-hidden />}
            >
              Simpan kontak admin
            </Button>
          </form>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
              <Settings className="size-4" aria-hidden />
            </span>
            <div>
              <p className="mono-label text-muted">Pratinjau</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
                Tombol “Butuh akses?”
              </h2>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-surface-2/60 p-4">
            <p className="text-xs leading-relaxed text-muted">
              Calon workspace mengisi form di halaman request akses. Setelah menekan tombol
              kirim, WhatsApp akan terbuka dengan pesan yang sudah terisi.
            </p>
            <div className="mt-3 rounded-xl border border-border bg-white px-3 py-2.5">
              <p className="mono-label text-[8px] text-muted">Tujuan WhatsApp</p>
              <p className="mt-1 font-mono text-xs text-ink">
                {normalized ? `+${normalized}` : "Belum diatur"}
              </p>
            </div>
            {previewLink ? (
              <a
                href={previewLink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:text-accent-strong"
              >
                <MessageCircle className="size-3.5" aria-hidden />
                Buka pratinjau WhatsApp
              </a>
            ) : (
              <p className="mt-3 text-[11px] text-warning">
                Isi nomor WhatsApp agar tombol request akses dapat membuka WhatsApp.
              </p>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-[10px] leading-relaxed text-muted">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
            <p>
              Perubahan tersimpan di server, jadi halaman request akses di Creator langsung memakai
              nomor terbaru tanpa deploy ulang.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-4">
        <MailSettingsSection />
      </div>

      <div className="mt-4">
        <AuditLogSection />
      </div>
    </div>
  );
}

function AiSettingsSection() {
  const modelsQuery = useAdminModelsFilteredQuery({});
  const providersQuery = useAdminProvidersQuery();
  const aiQuery = useQuery({
    queryKey: AI_SETTINGS_KEY,
    queryFn: () => apiRequest<AiSettingsPayload>("/api/cms/settings/ai"),
  });

  const settings = aiQuery.data;
  if (aiQuery.isPending || modelsQuery.isPending || providersQuery.isPending) {
    return (
      <section className="card p-5 sm:p-6">
        <SectionLoading />
      </section>
    );
  }
  if (aiQuery.isError || !settings) {
    return (
      <section className="card p-5 sm:p-6">
        <p className="text-xs text-danger">
          Gagal memuat pengaturan AI. Muat ulang halaman lalu coba lagi.
        </p>
      </section>
    );
  }

  return (
    <AiSettingsForm
      settings={settings}
      models={modelsQuery.data ?? []}
      providers={providersQuery.data ?? []}
    />
  );
}

function AiSettingsForm({
  settings,
  models,
  providers,
}: {
  settings: AiSettingsPayload;
  models: AiModel[];
  providers: { id: string; name: string }[];
}) {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);

  const [planModelId, setPlanModelId] = useState(settings.planModelId ?? "");
  const [analysisModelId, setAnalysisModelId] = useState(settings.analysisModelId ?? "");
  const [videoAnalysisModelId, setVideoAnalysisModelId] = useState(
    settings.videoAnalysisModelId ?? "",
  );
  const [defaultVideoModelId, setDefaultVideoModelId] = useState(
    settings.defaultVideoModelId ?? "",
  );

  const saveAi = useMutation({
    mutationFn: (input: AiSettingsPayload) =>
      apiRequest<AiSettingsPayload>("/api/cms/settings/ai", { method: "PUT", body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(AI_SETTINGS_KEY, data);
      pushToast("success", "Pengaturan AI disimpan.");
    },
    onError: (error) => pushToast("error", error.message),
  });

  const providerNames = new Map(providers.map((provider) => [provider.id, provider.name]));
  const planModels = models
    .filter((model) => model.outputCapabilities.includes("TEXT"))
    .sort(comparePlanModels);
  const videoOutputModels = models
    .filter((model) => model.outputCapabilities.includes("VIDEO"))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const imageInputModels = models.filter((model) => model.inputCapabilities.includes("IMAGE"));
  const videoInputModels = models.filter((model) => model.inputCapabilities.includes("VIDEO"));

  const planModel = models.find((model) => model.id === planModelId) ?? null;
  const missingCapabilities: MediaCapability[] = planModel
    ? (["IMAGE", "VIDEO"] as MediaCapability[]).filter(
        (capability) => !planModel.inputCapabilities.includes(capability),
      )
    : [];

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div>
          <p className="mono-label text-muted">Pipeline AI</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">
            Model plan, render, dan analisis
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <Field
            label="Model plan"
            htmlFor="ai-plan-model"
            hint="Menulis plan dan reprompt. Lampiran dikirim langsung ke model ini."
          >
            <Select
              id="ai-plan-model"
              value={planModelId}
              onChange={setPlanModelId}
              options={capabilityOptions(
                planModels,
                (model) =>
                  `${model.displayName} · ${providerNames.get(model.providerId) ?? "—"} · ${model.inputCapabilities.join("+")}`,
              )}
            />
          </Field>
          {missingCapabilities.length > 0 ? (
            <div className="mt-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2">
              <p className="text-[11px] font-medium text-ink">
                Model plan ini tidak menerima: {missingCapabilities.join(", ")}.
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">
                Lampiran dengan tipe tersebut otomatis dinonaktifkan di studio Creator.
              </p>
            </div>
          ) : null}
        </div>

        <Field
          label="Default model video"
          htmlFor="ai-default-video-model"
          hint="Model video yang otomatis dipilih saat tab Video dibuka di Creator."
        >
          <Select
            id="ai-default-video-model"
            value={defaultVideoModelId}
            onChange={setDefaultVideoModelId}
            options={capabilityOptions(
              videoOutputModels,
              (model) => `${model.displayName} · ${providerNames.get(model.providerId) ?? "—"}`,
            )}
          />
        </Field>

        <Field
          label="Analisis gambar"
          htmlFor="ai-analysis-model"
          hint="Model vision untuk menganalisis lampiran gambar."
        >
          <Select
            id="ai-analysis-model"
            value={analysisModelId}
            onChange={setAnalysisModelId}
            options={capabilityOptions(
              imageInputModels,
              (model) => `${model.displayName} · ${providerNames.get(model.providerId) ?? "—"}`,
            )}
          />
        </Field>

        <Field
          label="Analisis video"
          htmlFor="ai-video-analysis-model"
          hint="Model vision yang menerima input video."
        >
          <Select
            id="ai-video-analysis-model"
            value={videoAnalysisModelId}
            onChange={setVideoAnalysisModelId}
            options={capabilityOptions(
              videoInputModels,
              (model) => `${model.displayName} · ${providerNames.get(model.providerId) ?? "—"}`,
            )}
          />
        </Field>
      </div>

      <Button
        variant="primary"
        className="mt-5"
        loading={saveAi.isPending}
        icon={<Save className="size-4" aria-hidden />}
        onClick={() =>
          saveAi.mutate({
            planModelId: planModelId || null,
            analysisModelId: analysisModelId || null,
            videoAnalysisModelId: videoAnalysisModelId || null,
            defaultVideoModelId: defaultVideoModelId || null,
          })
        }
      >
        Simpan AI
      </Button>
    </section>
  );
}

function LimitsSettingsSection() {
  const limitsQuery = useLimitsSettingsQuery();

  if (limitsQuery.isPending) {
    return (
      <section className="card p-5 sm:p-6">
        <SectionLoading />
      </section>
    );
  }
  if (limitsQuery.isError || !limitsQuery.data) {
    return (
      <section className="card p-5 sm:p-6">
        <p className="text-xs text-danger">
          Gagal memuat batas prompt. Muat ulang halaman lalu coba lagi.
        </p>
      </section>
    );
  }

  return <LimitsSettingsForm settings={limitsQuery.data} />;
}

function LimitsSettingsForm({ settings }: { settings: LimitsSettings }) {
  const updateLimits = useUpdateLimitsMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [generationsPerDay, setGenerationsPerDay] = useState(
    String(settings.generationsPerDayPerWorkspace),
  );
  const [planPerHour, setPlanPerHour] = useState(String(settings.planRequestsPerHourPerUser));
  const [planPromptMaxChars, setPlanPromptMaxChars] = useState(String(settings.planPromptMaxChars));
  const [finalPromptMaxChars, setFinalPromptMaxChars] = useState(
    String(settings.finalPromptMaxChars),
  );
  const [maxSceneChainScenes, setMaxSceneChainScenes] = useState(
    String(settings.maxSceneChainScenes),
  );

  function handleSave(): void {
    const values: LimitsSettings = {
      generationsPerDayPerWorkspace: Number(generationsPerDay),
      planRequestsPerHourPerUser: Number(planPerHour),
      planPromptMaxChars: Number(planPromptMaxChars),
      finalPromptMaxChars: Number(finalPromptMaxChars),
      maxSceneChainScenes: Number(maxSceneChainScenes),
    };

    const invalid = (value: number, min: number, max: number): boolean =>
      !Number.isInteger(value) || value < min || value > max;

    if (invalid(values.generationsPerDayPerWorkspace, 1, 1000)) {
      pushToast("error", "Render per hari harus 1–1000.");
      return;
    }
    if (invalid(values.planRequestsPerHourPerUser, 1, 10000)) {
      pushToast("error", "Plan per jam harus 1–10000.");
      return;
    }
    if (invalid(values.planPromptMaxChars, 200, 20000)) {
      pushToast("error", "Batas brief harus 200–20000 karakter.");
      return;
    }
    if (invalid(values.finalPromptMaxChars, 200, 32000)) {
      pushToast("error", "Batas prompt final harus 200–32000 karakter.");
      return;
    }
    if (invalid(values.maxSceneChainScenes, 1, 10)) {
      pushToast("error", "Scene chain maksimum harus 1–10.");
      return;
    }

    updateLimits.mutate(values, {
      onSuccess: () => pushToast("success", "Batas prompt disimpan."),
      onError: (error) => pushToast("error", error.message),
    });
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
          <Settings className="size-4" aria-hidden />
        </span>
        <div>
          <p className="mono-label text-muted">Kuota &amp; panjang prompt</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Batas prompt</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Render per hari per workspace"
          htmlFor="limits-generations"
          hint="1–1000 render."
        >
          <TextInput
            id="limits-generations"
            type="number"
            min={1}
            max={1000}
            value={generationsPerDay}
            onChange={(event) => setGenerationsPerDay(event.target.value)}
          />
        </Field>
        <Field
          label="Plan per jam per user"
          htmlFor="limits-plan-hour"
          hint="1–10000 permintaan plan."
        >
          <TextInput
            id="limits-plan-hour"
            type="number"
            min={1}
            max={10000}
            value={planPerHour}
            onChange={(event) => setPlanPerHour(event.target.value)}
          />
        </Field>
        <Field
          label="Batas brief (karakter)"
          htmlFor="limits-plan-chars"
          hint="Batas isian brief di Plan Canvas. 200–20000."
        >
          <TextInput
            id="limits-plan-chars"
            type="number"
            min={200}
            max={20000}
            value={planPromptMaxChars}
            onChange={(event) => setPlanPromptMaxChars(event.target.value)}
          />
        </Field>
        <Field
          label="Batas prompt final (karakter)"
          htmlFor="limits-final-chars"
          hint="Dipakai model yang tidak punya batas sendiri. 200–32000."
        >
          <TextInput
            id="limits-final-chars"
            type="number"
            min={200}
            max={32000}
            value={finalPromptMaxChars}
            onChange={(event) => setFinalPromptMaxChars(event.target.value)}
          />
        </Field>
        <Field
          label="Scene chain maksimum"
          htmlFor="limits-scene-chain"
          hint="Jumlah scene selesai yang boleh dipilih untuk continuity. 1–10."
        >
          <TextInput
            id="limits-scene-chain"
            type="number"
            min={1}
            max={10}
            value={maxSceneChainScenes}
            onChange={(event) => setMaxSceneChainScenes(event.target.value)}
          />
        </Field>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Prompt final yang melebihi batas akan dimampatkan otomatis oleh model plan; bila model plan
        tidak tersedia, prompt dipotong pada batas kata terdekat.
      </p>

      <Button
        variant="primary"
        className="mt-4"
        loading={updateLimits.isPending}
        icon={<Save className="size-4" aria-hidden />}
        onClick={handleSave}
      >
        Simpan batas prompt
      </Button>
    </section>
  );
}

function MailSettingsSection() {
  const mailQuery = useAdminMailSettingsQuery();
  const settings = mailQuery.data;

  if (mailQuery.isPending) {
    return (
      <section className="card p-5 sm:p-6">
        <SectionLoading />
      </section>
    );
  }
  if (mailQuery.isError || !settings) {
    return (
      <section className="card p-5 sm:p-6">
        <p className="text-xs text-danger">
          Gagal memuat pengaturan email. Muat ulang halaman lalu coba lagi.
        </p>
      </section>
    );
  }

  return <MailSettingsForm settings={settings} />;
}

function MailSettingsForm({ settings }: { settings: MailSettings }) {
  const updateMail = useUpdateMailSettingsMutation();
  const testMail = useTestMailMutation();
  const pushToast = useUiStore((state) => state.pushToast);

  const [driver, setDriver] = useState<"smtp" | "log">(settings.driver);
  const [fromName, setFromName] = useState(settings.fromName);
  const [fromEmail, setFromEmail] = useState(settings.fromEmail);
  const [host, setHost] = useState(settings.smtp.host);
  const [port, setPort] = useState(String(settings.smtp.port));
  const [secure, setSecure] = useState(settings.smtp.secure);
  const [user, setUser] = useState(settings.smtp.user);
  const [password, setPassword] = useState("");

  const [testOpen, setTestOpen] = useState(false);
  const [testTo, setTestTo] = useState("");

  function handleSave(): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail.trim())) {
      pushToast("error", "Format email pengirim tidak valid.");
      return;
    }
    const portNumber = Number(port);
    if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      pushToast("error", "Port SMTP harus angka 1–65535.");
      return;
    }
    if (driver === "smtp" && host.trim().length === 0) {
      pushToast("error", "Host SMTP wajib diisi untuk driver smtp.");
      return;
    }

    updateMail.mutate(
      {
        driver,
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        smtp: {
          host: host.trim(),
          port: portNumber,
          secure,
          user: user.trim(),
          password: password.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setPassword("");
          pushToast("success", "Pengaturan email disimpan.");
        },
        onError: (error) => pushToast("error", error.message),
      },
    );
  }

  function handleTest(): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo.trim())) {
      pushToast("error", "Format email tujuan tidak valid.");
      return;
    }
    testMail.mutate(testTo.trim(), {
      onSuccess: (result) => {
        pushToast(result.ok ? "success" : "error", result.message);
        if (result.ok) setTestOpen(false);
      },
      onError: (error) => pushToast("error", error.message),
    });
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
          <Mail className="size-4" aria-hidden />
        </span>
        <div>
          <p className="mono-label text-muted">Notifikasi</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Email</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Field
          label="Driver"
          htmlFor="mail-driver"
          hint={
            driver === "log"
              ? "Driver log menulis email ke outbox server tanpa mengirim ke SMTP."
              : "Email dikirim lewat SMTP."
          }
        >
          <Select
            id="mail-driver"
            value={driver}
            onChange={(value) => setDriver(value === "smtp" ? "smtp" : "log")}
            options={[
              { value: "log", label: "Log (outbox)" },
              { value: "smtp", label: "SMTP" },
            ]}
          />
        </Field>
        <Field label="Nama pengirim" htmlFor="mail-from-name">
          <TextInput
            id="mail-from-name"
            value={fromName}
            onChange={(event) => setFromName(event.target.value)}
            placeholder="Rupakarsa"
          />
        </Field>
        <Field label="Email pengirim" htmlFor="mail-from-email">
          <TextInput
            id="mail-from-email"
            type="email"
            value={fromEmail}
            onChange={(event) => setFromEmail(event.target.value)}
            placeholder="no-reply@rupakarsa.id"
          />
        </Field>
        <Field label="Host SMTP" htmlFor="mail-host">
          <TextInput
            id="mail-host"
            value={host}
            onChange={(event) => setHost(event.target.value)}
            placeholder="smtp.domain.com"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Port" htmlFor="mail-port">
            <TextInput
              id="mail-port"
              type="number"
              min={1}
              max={65535}
              value={port}
              onChange={(event) => setPort(event.target.value)}
            />
          </Field>
          <label className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-3">
            <input
              type="checkbox"
              checked={secure}
              onChange={(event) => setSecure(event.target.checked)}
              className="mt-0.5 size-4 accent-[#d93e14]"
            />
            <span>
              <span className="block text-xs font-medium text-ink">Secure (TLS)</span>
              <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                Aktifkan untuk port 465.
              </span>
            </span>
          </label>
        </div>
        <Field label="User SMTP" htmlFor="mail-user">
          <TextInput
            id="mail-user"
            value={user}
            onChange={(event) => setUser(event.target.value)}
            placeholder="user@domain.com"
          />
        </Field>
        <Field label="Password SMTP" htmlFor="mail-password">
          <TextInput
            id="mail-password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Kosongkan untuk mempertahankan"
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant="primary"
          loading={updateMail.isPending}
          icon={<Save className="size-4" aria-hidden />}
          onClick={handleSave}
        >
          Simpan email
        </Button>
        <Button
          variant="secondary"
          icon={<Mail className="size-4" aria-hidden />}
          onClick={() => setTestOpen(true)}
        >
          Kirim email uji
        </Button>
      </div>

      <Dialog
        open={testOpen}
        title="Kirim email uji"
        description="Email uji dikirim memakai konfigurasi yang sudah tersimpan."
        onClose={() => setTestOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTestOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" loading={testMail.isPending} onClick={handleTest}>
              Kirim
            </Button>
          </>
        }
      >
        <Field label="Email tujuan" htmlFor="mail-test-to">
          <TextInput
            id="mail-test-to"
            type="email"
            value={testTo}
            onChange={(event) => setTestTo(event.target.value)}
            placeholder="halo@rupakarsa.id"
            autoFocus
          />
        </Field>
      </Dialog>
    </section>
  );
}

function AuditLogSection() {
  const logsQuery = useAdminAuditLogsQuery();

  if (logsQuery.isPending) {
    return (
      <section className="card p-5 sm:p-6">
        <SectionLoading />
      </section>
    );
  }
  if (logsQuery.isError) {
    return (
      <section className="card p-5 sm:p-6">
        <p className="text-xs text-danger">
          Gagal memuat audit log. Muat ulang halaman lalu coba lagi.
        </p>
      </section>
    );
  }

  const logs = logsQuery.data ?? [];

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-canvas-2 text-ink">
          <History className="size-4" aria-hidden />
        </span>
        <div>
          <p className="mono-label text-muted">Jejak aktivitas</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">Audit log</h2>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border">
        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr] gap-3 border-b border-border bg-surface-2/40 px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] text-muted sm:grid">
          <span>Aksi</span>
          <span>Target</span>
          <span>Waktu</span>
        </div>
        {logs.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted">Belum ada aktivitas tercatat.</p>
        ) : null}
        {logs.map((log) => (
          <div
            key={log.id}
            className="grid gap-1 border-b border-border/60 px-4 py-2.5 text-[11px] last:border-b-0 sm:grid-cols-[1.4fr_1fr_0.8fr] sm:items-center sm:gap-3"
          >
            <span className="font-mono text-ink">{log.action}</span>
            <span className="text-muted">{log.targetType}</span>
            <span className="text-muted">{formatDateTime(log.createdAt)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
