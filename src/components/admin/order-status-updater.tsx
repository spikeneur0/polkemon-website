"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/actions/orders";
import { ORDER_STATUSES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";

interface Props {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleUpdate() {
    setSaving(true);
    await updateOrderStatus(orderId, status as OrderStatus);
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="mt-3 space-y-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={saving || status === currentStatus}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Updating..." : "Update Status"}
      </button>
    </div>
  );
}
