"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { computeEffectivePrice } from "@/lib/services/marketPriceSync";

export async function enableMarketPricing(
  productId: string,
  data: {
    justTcgId: string;
    tcgplayerId: string | null;
    condition: string;
    printing: string;
    markup: number;
    marketPriceCents: number;
    linkedCardName: string;
  }
) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, error: "Product not found" };

  const effectivePrice = computeEffectivePrice(data.marketPriceCents, data.markup);

  await db.product.update({
    where: { id: productId },
    data: {
      marketPriceEnabled: true,
      justTcgId: data.justTcgId,
      tcgplayerId: data.tcgplayerId,
      marketPriceCondition: data.condition,
      marketPricePrinting: data.printing,
      marketPriceMarkup: data.markup,
      marketPrice: data.marketPriceCents,
      marketPriceLastUpdated: new Date(),
      manualPrice: product.price, // preserve current price as fallback
      linkedCardName: data.linkedCardName,
      price: effectivePrice,
    },
  });

  revalidatePaths();
  return { success: true, effectivePrice };
}

export async function disableMarketPricing(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, error: "Product not found" };

  await db.product.update({
    where: { id: productId },
    data: {
      marketPriceEnabled: false,
      price: product.manualPrice ?? product.price,
      manualPrice: null,
    },
  });

  revalidatePaths();
  return { success: true };
}

export async function updateMarketPricingFields(
  productId: string,
  data: {
    condition?: string;
    printing?: string;
    markup?: number;
  }
) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, error: "Product not found" };

  const updateData: Record<string, unknown> = {};

  if (data.condition !== undefined) updateData.marketPriceCondition = data.condition;
  if (data.printing !== undefined) updateData.marketPricePrinting = data.printing;
  if (data.markup !== undefined) updateData.marketPriceMarkup = data.markup;

  // Recompute effective price if we have a market price and the product is enabled
  if (product.marketPriceEnabled && product.marketPrice) {
    const markup = data.markup ?? Number(product.marketPriceMarkup);
    const effectivePrice = computeEffectivePrice(product.marketPrice, markup);
    updateData.price = effectivePrice;
  }

  await db.product.update({
    where: { id: productId },
    data: updateData,
  });

  revalidatePaths();
  return { success: true };
}

export async function linkCard(
  productId: string,
  justTcgId: string,
  tcgplayerId: string | null,
  linkedCardName: string
) {
  await db.product.update({
    where: { id: productId },
    data: {
      justTcgId,
      tcgplayerId,
      linkedCardName,
    },
  });

  revalidatePaths();
  return { success: true };
}

export async function unlinkCard(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, error: "Product not found" };

  const updateData: Record<string, unknown> = {
    justTcgId: null,
    tcgplayerId: null,
    linkedCardName: null,
    marketPriceEnabled: false,
    marketPrice: null,
    marketPriceLastUpdated: null,
  };

  // Restore manual price if market pricing was enabled
  if (product.marketPriceEnabled && product.manualPrice != null) {
    updateData.price = product.manualPrice;
    updateData.manualPrice = null;
  }

  await db.product.update({
    where: { id: productId },
    data: updateData,
  });

  revalidatePaths();
  return { success: true };
}

function revalidatePaths() {
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/");
}
