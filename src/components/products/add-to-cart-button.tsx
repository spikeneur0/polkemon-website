"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem } from "@/types";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    slug: string;
    images: string[];
    isSoldOut: boolean;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  if (product.isSoldOut) {
    return (
      <button
        disabled
        className="w-full rounded-md bg-muted py-3 text-sm font-medium text-muted-foreground"
      >
        Sold Out
      </button>
    );
  }

  function handleAdd() {
    const item: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity,
      slug: product.slug,
    };
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center gap-2 rounded-md border border-input">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 transition-colors hover:bg-accent"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 transition-colors hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <button
        onClick={handleAdd}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ShoppingCart className="h-4 w-4" />
        {added ? "Added!" : "Add to Cart"}
      </button>
    </div>
  );
}
