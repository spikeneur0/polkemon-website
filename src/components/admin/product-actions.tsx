"use client";

import { toggleSoldOut } from "@/actions/products";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  productId: string;
  isSoldOut: boolean;
}

export function AdminProductActions({
  productId,
  isSoldOut,
}: ProductActionsProps) {
  const router = useRouter();

  async function handleToggle() {
    await toggleSoldOut(productId);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        isSoldOut ? "bg-destructive" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          isSoldOut ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
