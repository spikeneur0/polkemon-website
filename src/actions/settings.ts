"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  let settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await db.siteSettings.create({ data: { id: "default" } });
  }
  return {
    ...settings,
    marketPriceDefaultMarkup: Number(settings.marketPriceDefaultMarkup),
  };
}

export async function updateSettings(data: {
  marketPriceMasterEnabled?: boolean;
  marketPriceDefaultMarkup?: number;
  marketPriceDefaultCondition?: string;
  marketPriceSyncFrequency?: string;
  marketPriceShowBadge?: boolean;
}) {
  await db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function bulkEnableMarketPricing() {
  // Enable market pricing for all products that have a linked card
  const result = await db.product.updateMany({
    where: {
      tcgplayerId: { not: null },
      marketPriceEnabled: false,
    },
    data: {
      marketPriceEnabled: true,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/admin/settings");
  return { success: true, count: result.count };
}

export async function bulkDisableMarketPricing() {
  // First, restore manual prices for all market-priced products
  const products = await db.product.findMany({
    where: { marketPriceEnabled: true },
    select: { id: true, manualPrice: true, price: true },
  });

  for (const product of products) {
    await db.product.update({
      where: { id: product.id },
      data: {
        marketPriceEnabled: false,
        price: product.manualPrice ?? product.price,
        manualPrice: null,
      },
    });
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/settings");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true, count: products.length };
}

export async function getSyncLogs(limit = 50) {
  return db.marketPriceSyncLog.findMany({
    take: limit,
    orderBy: { startedAt: "desc" },
  });
}
