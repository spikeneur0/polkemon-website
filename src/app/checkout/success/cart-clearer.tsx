"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

export function CartClearer() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
