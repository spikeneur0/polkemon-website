"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

export default function CheckoutSuccessPage() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6">
      <CheckCircle className="h-16 w-16 text-green-600" />
      <h1 className="mt-6 text-2xl font-bold">Thank you for your order!</h1>
      <p className="mt-3 text-muted-foreground">
        Your payment was successful. You&apos;ll receive a confirmation email
        shortly with your order details.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/products"
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
