import { db } from "@/lib/db";
import { bulkGetPrices, getCardPrice, type BulkPriceRequest } from "./justTcg";
import { revalidatePath } from "next/cache";

const BATCH_SIZE = 20; // Free tier max per bulk request
const BATCH_DELAY_MS = 7_000; // 7s between batches (stay under 10/min)

export function computeEffectivePrice(
  marketPriceCents: number,
  markupPercent: number
): number {
  return Math.round(marketPriceCents * (1 + markupPercent / 100));
}

export interface SyncResult {
  success: boolean;
  totalProducts: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ productId: string; productName: string; error: string }>;
  apiCallsUsed: number;
  durationMs: number;
}

export async function syncAllProducts(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: SyncResult["errors"] = [];
  let successCount = 0;
  let apiCallsUsed = 0;

  // Check master toggle
  const settings = await db.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings?.marketPriceMasterEnabled) {
    return {
      success: false,
      totalProducts: 0,
      successCount: 0,
      errorCount: 0,
      errors: [{ productId: "", productName: "", error: "Master toggle is disabled" }],
      apiCallsUsed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Fetch all products that need syncing
  const products = await db.product.findMany({
    where: {
      marketPriceEnabled: true,
      tcgplayerId: { not: null },
    },
    select: {
      id: true,
      name: true,
      tcgplayerId: true,
      marketPriceCondition: true,
      marketPricePrinting: true,
      marketPriceMarkup: true,
      marketPrice: true,
      price: true,
    },
  });

  const totalProducts = products.length;

  if (totalProducts === 0) {
    await createSyncLog({
      totalProducts: 0,
      successCount: 0,
      errorCount: 0,
      errors: null,
      apiCallsUsed: 0,
      durationMs: Date.now() - startTime,
      triggeredBy: "manual",
    });
    return {
      success: true,
      totalProducts: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      apiCallsUsed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // Batch into groups of BATCH_SIZE
  const batches: typeof products[] = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE));
  }

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];

    // Build bulk request
    const requests: BulkPriceRequest[] = batch.map((p) => ({
      tcgplayerId: p.tcgplayerId!,
      condition: p.marketPriceCondition,
      printing: p.marketPricePrinting,
    }));

    try {
      const result = await bulkGetPrices(requests);
      apiCallsUsed += result.apiCallsUsed;

      // Update each product
      for (const product of batch) {
        const priceCents = result.prices.get(product.tcgplayerId!);

        if (priceCents == null) {
          // No price found — keep existing price
          errors.push({
            productId: product.id,
            productName: product.name,
            error: `No price found for ${product.marketPriceCondition} / ${product.marketPricePrinting}`,
          });
          continue;
        }

        if (priceCents <= 0) {
          errors.push({
            productId: product.id,
            productName: product.name,
            error: "Price was $0 — keeping existing price",
          });
          continue;
        }

        const markup = Number(product.marketPriceMarkup);
        const effectivePrice = computeEffectivePrice(priceCents, markup);

        await db.product.update({
          where: { id: product.id },
          data: {
            marketPrice: priceCents,
            marketPriceLastUpdated: new Date(),
            price: effectivePrice,
          },
        });

        successCount++;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      for (const product of batch) {
        errors.push({
          productId: product.id,
          productName: product.name,
          error: errorMsg,
        });
      }
    }

    // Delay between batches to respect rate limits
    if (batchIdx < batches.length - 1) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  const durationMs = Date.now() - startTime;

  await createSyncLog({
    totalProducts,
    successCount,
    errorCount: errors.length,
    errors: errors.length > 0 ? errors : null,
    apiCallsUsed,
    durationMs,
    triggeredBy: "manual",
  });

  revalidatePath("/products");
  revalidatePath("/");

  return {
    success: true,
    totalProducts,
    successCount,
    errorCount: errors.length,
    errors,
    apiCallsUsed,
    durationMs,
  };
}

export async function syncSingleProduct(
  productId: string
): Promise<{ success: boolean; priceCents?: number; effectivePrice?: number; error?: string }> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      tcgplayerId: true,
      marketPriceEnabled: true,
      marketPriceCondition: true,
      marketPricePrinting: true,
      marketPriceMarkup: true,
      marketPrice: true,
      price: true,
    },
  });

  if (!product) {
    return { success: false, error: "Product not found" };
  }

  if (!product.tcgplayerId) {
    return { success: false, error: "No TCGplayer ID linked" };
  }

  try {
    const { priceCents } = await getCardPrice(
      product.tcgplayerId,
      product.marketPriceCondition,
      product.marketPricePrinting
    );

    if (priceCents == null || priceCents <= 0) {
      return {
        success: false,
        error: `No price available for ${product.marketPriceCondition} / ${product.marketPricePrinting}`,
      };
    }

    const markup = Number(product.marketPriceMarkup);
    const effectivePrice = computeEffectivePrice(priceCents, markup);

    await db.product.update({
      where: { id: productId },
      data: {
        marketPrice: priceCents,
        marketPriceLastUpdated: new Date(),
        ...(product.marketPriceEnabled ? { price: effectivePrice } : {}),
      },
    });

    await createSyncLog({
      totalProducts: 1,
      successCount: 1,
      errorCount: 0,
      errors: null,
      apiCallsUsed: 1,
      durationMs: 0,
      triggeredBy: "single",
    });

    revalidatePath("/products");
    revalidatePath("/");

    return { success: true, priceCents, effectivePrice };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: errorMsg };
  }
}

async function createSyncLog(data: {
  totalProducts: number;
  successCount: number;
  errorCount: number;
  errors: unknown;
  apiCallsUsed: number;
  durationMs: number;
  triggeredBy: string;
}) {
  await db.marketPriceSyncLog.create({
    data: {
      completedAt: new Date(),
      totalProducts: data.totalProducts,
      successCount: data.successCount,
      errorCount: data.errorCount,
      errors: data.errors as never,
      apiCallsUsed: data.apiCallsUsed,
      triggeredBy: data.triggeredBy,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
