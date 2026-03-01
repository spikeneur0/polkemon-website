"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function getSettings() {
  await requireAdmin();
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
  await requireAdmin();
  await db.siteSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...data },
    update: data,
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function bulkEnableMarketPricing() {
  await requireAdmin();
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

  revalidatePath("/", "layout");
  return { success: true, count: result.count };
}

export async function bulkDisableMarketPricing() {
  await requireAdmin();
  // Fetch all market-priced products to restore their manual prices
  const products = await db.product.findMany({
    where: { marketPriceEnabled: true },
    select: { id: true, manualPrice: true, price: true },
  });

  // Batch all updates in a single transaction (1 DB round-trip instead of N)
  if (products.length > 0) {
    await db.$transaction(
      products.map((product) =>
        db.product.update({
          where: { id: product.id },
          data: {
            marketPriceEnabled: false,
            price: product.manualPrice ?? product.price,
            manualPrice: null,
          },
        })
      )
    );
  }

  revalidatePath("/", "layout");
  return { success: true, count: products.length };
}

export async function getSyncLogs(limit = 50) {
  await requireAdmin();
  return db.marketPriceSyncLog.findMany({
    take: limit,
    orderBy: { startedAt: "desc" },
  });
}
