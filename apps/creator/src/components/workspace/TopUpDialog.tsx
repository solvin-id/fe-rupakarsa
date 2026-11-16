"use client";

import { Copy, Loader2, Wallet } from "lucide-react";
import { useState } from "react";

import {
  useBillingOrdersQuery,
  useBillingPackagesQuery,
  useCreateOrderMutation,
} from "@rupakarsa/shared/hooks/use-billing";
import { formatDate, formatRupiah, formatTokens } from "@rupakarsa/shared/lib/format";
import { useUiStore } from "@rupakarsa/shared/stores/ui-store";
import { Button, Dialog } from "@rupakarsa/shared/ui";

export function TopUpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const packagesQuery = useBillingPackagesQuery();
  const ordersQuery = useBillingOrdersQuery();
  const createOrder = useCreateOrderMutation();
  const pushToast = useUiStore((state) => state.pushToast);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const packages = packagesQuery.data ?? [];
  const orders = ordersQuery.data ?? [];

  function handleBuy(packageId: string): void {
    setPendingId(packageId);
    createOrder.mutate(packageId, {
      onSuccess: (result) => {
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
          return;
        }
        pushToast(
          "info",
          `Order ${result.order.id.slice(0, 8)} dibuat. Transfer ${formatRupiah(result.order.amountRupiah)} lalu hubungi admin Rupakarsa.`,
        );
      },
      onError: (error) => pushToast("error", error.message),
      onSettled: () => setPendingId(null),
    });
  }

  return (
    <Dialog
      open={open}
      title="Top-up token"
      description="Paket mengikuti harga di CMS. Token dan kuota Plan Mode ditambahkan setelah pembayaran terverifikasi."
      onClose={onClose}
      widthClassName="max-w-2xl"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {packagesQuery.isPending ? (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Memuat paket…
          </div>
        ) : packages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
            Belum ada paket aktif. Hubungi admin Rupakarsa.
          </p>
        ) : (
          packages.map((offer) => (
            <div
              key={offer.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Wallet className="size-4 text-accent" aria-hidden />
                  {formatTokens(offer.tokens)} token
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  +{formatTokens(offer.planQuota)} kuota Plan Mode gratis
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold tracking-[-0.02em] text-ink">
                  {formatRupiah(offer.priceRupiah)}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  loading={pendingId === offer.id}
                  onClick={() => handleBuy(offer.id)}
                >
                  Beli
                </Button>
              </div>
            </div>
          ))
        )}

        <div>
          <p className="mono-label text-muted">Order terakhir</p>
          {orders.length === 0 ? (
            <p className="mt-1.5 text-[11px] text-muted">Belum ada order di workspace ini.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
              {orders.slice(0, 5).map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[10px] text-ink">{order.id}</span>
                    <span className="text-[10px] text-muted">
                      {formatDate(order.createdAt)} · {formatTokens(order.tokens)} token
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                        order.status === "PAID"
                          ? "bg-success/10 text-success"
                          : order.status === "PENDING"
                            ? "bg-warning/10 text-warning"
                            : "bg-danger/10 text-danger"
                      }`}
                    >
                      {order.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(order.id);
                        pushToast("success", "ID order disalin.");
                      }}
                      aria-label="Salin ID order"
                      className="text-muted transition-colors hover:text-ink"
                    >
                      <Copy className="size-3" aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-muted">
            Driver pembayaran diatur di CMS. Tanpa payment gateway, admin menandai order lunas
            secara manual.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
