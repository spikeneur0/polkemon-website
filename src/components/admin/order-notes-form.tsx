"use client";

import { useState } from "react";
import { addOrderNote } from "@/actions/orders";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  currentNotes: string;
}

export function OrderNotesForm({ orderId, currentNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await addOrderNote(orderId, notes);
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <h3 className="font-semibold">Internal Notes</h3>
      <div className="mt-3 space-y-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this order..."
          rows={3}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}
