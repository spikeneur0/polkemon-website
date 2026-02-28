"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { togglePromoCode, deletePromoCode } from "@/actions/promo-codes";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import PromoCodeForm from "./promo-code-form";

interface PromoCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderCents: number | null;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  expiresAt: Date | string | null;
  createdAt: Date | string;
}

function formatDiscount(type: string, value: number): string {
  if (type === "percentage") {
    return `${value}% off`;
  }
  return `${formatPrice(value)} off`;
}

function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function formatUsage(currentUses: number, maxUses: number | null): string {
  if (maxUses === null) {
    return `${currentUses}/\u221E`;
  }
  return `${currentUses}/${maxUses}`;
}

export default function PromoCodesTable({
  promoCodes,
}: {
  promoCodes: PromoCode[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleToggle(id: string) {
    startTransition(async () => {
      await togglePromoCode(id);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setDeletingId(id);
  }

  function confirmDelete() {
    if (!deletingId) return;
    startTransition(async () => {
      await deletePromoCode(deletingId);
      setDeletingId(null);
      router.refresh();
    });
  }

  function handleEdit(promoCode: PromoCode) {
    setEditingCode(promoCode);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingCode(null);
    setShowForm(true);
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditingCode(null);
    router.refresh();
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingCode(null);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Promo Code
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">Discount</th>
              <th className="px-4 py-3 text-left font-medium">Min Order</th>
              <th className="px-4 py-3 text-center font-medium">Uses</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Expires</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No promo codes yet. Create one to get started.
                </td>
              </tr>
            ) : (
              promoCodes.map((promo) => {
                const expired = isExpired(promo.expiresAt);
                const maxedOut =
                  promo.maxUses !== null &&
                  promo.currentUses >= promo.maxUses;

                return (
                  <tr
                    key={promo.id}
                    className="border-b border-border last:border-0"
                  >
                    {/* Code */}
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold">
                        {promo.code}
                      </span>
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3">
                      {formatDiscount(promo.discountType, promo.discountValue)}
                    </td>

                    {/* Min Order */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {promo.minOrderCents
                        ? formatPrice(promo.minOrderCents)
                        : "\u2014"}
                    </td>

                    {/* Uses */}
                    <td className="px-4 py-3 text-center tabular-nums">
                      {formatUsage(promo.currentUses, promo.maxUses)}
                      {maxedOut && (
                        <span className="ml-1.5 inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Maxed
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {expired ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Expired
                        </span>
                      ) : promo.isActive ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Expires */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {promo.expiresAt
                        ? new Date(promo.expiresAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "Never"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(promo.id)}
                          disabled={isPending}
                          title={
                            promo.isActive ? "Deactivate" : "Activate"
                          }
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                        >
                          {promo.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(promo)}
                          title="Edit"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          disabled={isPending}
                          title="Delete"
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <PromoCodeForm
          promoCode={editingCode}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Delete Promo Code</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete this promo code? This action
              cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
