"use client";

import { useState } from "react";
import { updateTrackingNumber } from "@/actions/orders";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  currentTracking: string;
}

export function OrderTrackingForm({ orderId, currentTracking }: Props) {
  const router = useRouter();
  const [tracking, setTracking] = useState(currentTracking);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateTrackingNumber(orderId, tracking);
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <h3 className="font-semibold">Tracking Number</h3>
      <div className="mt-3 space-y-3">
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Enter tracking number"
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Tracking"}
        </button>
      </div>
    </div>
  );
}
