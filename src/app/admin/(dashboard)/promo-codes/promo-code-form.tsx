"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createPromoCode, updatePromoCode } from "@/actions/promo-codes";

interface PromoCodeData {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderCents: number | null;
  maxUses: number | null;
  isActive: boolean;
  expiresAt: Date | string | null;
}

interface PromoCodeFormProps {
  promoCode?: PromoCodeData | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PromoCodeForm({
  promoCode,
  onClose,
  onSaved,
}: PromoCodeFormProps) {
  const isEditing = !!promoCode;

  const [code, setCode] = useState(promoCode?.code ?? "");
  const [discountType, setDiscountType] = useState(
    promoCode?.discountType ?? "percentage"
  );
  const [discountValue, setDiscountValue] = useState(
    promoCode
      ? promoCode.discountType === "fixed"
        ? (promoCode.discountValue / 100).toString()
        : promoCode.discountValue.toString()
      : ""
  );
  const [minOrderDollars, setMinOrderDollars] = useState(
    promoCode?.minOrderCents ? (promoCode.minOrderCents / 100).toString() : ""
  );
  const [maxUses, setMaxUses] = useState(
    promoCode?.maxUses ? promoCode.maxUses.toString() : ""
  );
  const [isActive, setIsActive] = useState(promoCode?.isActive ?? true);
  const [expiresAt, setExpiresAt] = useState(() => {
    if (!promoCode?.expiresAt) return "";
    const d = new Date(promoCode.expiresAt);
    return d.toISOString().slice(0, 16);
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const parsedValue = parseFloat(discountValue);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      setError("Please enter a valid discount value");
      setSaving(false);
      return;
    }

    // For fixed type, convert dollars to cents
    const finalValue =
      discountType === "fixed" ? Math.round(parsedValue * 100) : parsedValue;

    const minOrderCents = minOrderDollars
      ? Math.round(parseFloat(minOrderDollars) * 100)
      : null;

    const parsedMaxUses = maxUses ? parseInt(maxUses) : null;

    const data = {
      code,
      discountType,
      discountValue: finalValue,
      minOrderCents:
        minOrderCents !== null && !isNaN(minOrderCents) ? minOrderCents : null,
      maxUses:
        parsedMaxUses !== null && !isNaN(parsedMaxUses) ? parsedMaxUses : null,
      isActive,
      expiresAt: expiresAt || null,
    };

    try {
      const result = isEditing
        ? await updatePromoCode(promoCode.id, data)
        : await createPromoCode(data);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        setSaving(false);
        return;
      }

      onSaved();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold">
          {isEditing ? "Edit Promo Code" : "Create Promo Code"}
        </h2>

        {error && (
          <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Discount Type + Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                {discountType === "percentage" ? "Percentage" : "Amount ($)"}
              </label>
              <input
                type="number"
                step={discountType === "percentage" ? "1" : "0.01"}
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "10" : "5.00"}
                required
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Min Order + Max Uses */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Min Order ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minOrderDollars}
                onChange={(e) => setMinOrderDollars(e.target.value)}
                placeholder="No minimum"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Max Uses
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              Expires At
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank for no expiration
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                isActive ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-foreground">Active</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Promo Code"
                  : "Create Promo Code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
