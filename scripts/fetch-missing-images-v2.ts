/**
 * fetch-missing-images-v2.ts
 *
 * Second pass: smarter matching for products that the first script couldn't match.
 * Uses keyword-based scoring, special handling for Dragon Shield variants,
 * and tries multiple search strategies.
 *
 * Usage: npx tsx scripts/fetch-missing-images-v2.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  title: string;
  handle: string;
  images: ShopifyImage[];
  product_type: string;
}

interface ShopifyResponse {
  products: ShopifyProduct[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract color/style keywords from a Dragon Shield product name.
 * e.g. "Dragon Shield: Emerald (Matte) 100ct" -> ["emerald", "matte", "100ct"]
 *      "Dragon Shield Emerald Matte" -> ["emerald", "matte"]
 */
function extractDragonShieldKeywords(name: string): string[] {
  const cleaned = name
    .replace(/dragon\s*shield:?\s*/i, "")
    .replace(/standard\s*/i, "")
    .replace(/japanese\s*size\s*/i, "japanese ")
    .toLowerCase();

  // Extract meaningful keywords
  const keywords: string[] = [];
  const parts = cleaned.split(/[\s(),:]+/).filter(Boolean);

  for (const p of parts) {
    // Skip generic words
    if (["sleeves", "sleeve", "card", "trading", "ct", "art"].includes(p))
      continue;
    keywords.push(p);
  }

  return keywords;
}

/**
 * Score how well a Shopify product matches a DB product.
 * Higher = better match. Returns 0 for no match.
 */
function scoreMatch(
  dbName: string,
  shopifyTitle: string,
  dbCategory: string
): number {
  const dbNorm = normalize(dbName);
  const shopNorm = normalize(shopifyTitle);

  // Exact match
  if (dbNorm === shopNorm) return 100;

  // Containment match
  if (shopNorm.includes(dbNorm) || dbNorm.includes(shopNorm)) {
    const ratio =
      Math.min(dbNorm.length, shopNorm.length) /
      Math.max(dbNorm.length, shopNorm.length);
    return 50 + ratio * 40;
  }

  // Dragon Shield special matching
  if (
    dbName.toLowerCase().includes("dragon shield") &&
    shopifyTitle.toLowerCase().includes("dragon shield")
  ) {
    const dbKw = extractDragonShieldKeywords(dbName);
    const shopKw = extractDragonShieldKeywords(shopifyTitle);

    if (dbKw.length === 0 || shopKw.length === 0) return 0;

    // Count how many DB keywords appear in the Shopify keywords
    let matchCount = 0;
    for (const kw of dbKw) {
      if (shopKw.some((sk) => sk.includes(kw) || kw.includes(sk))) {
        matchCount++;
      }
    }

    const matchRatio = matchCount / dbKw.length;

    // Need at least 70% keyword overlap for Dragon Shield
    if (matchRatio >= 0.7 && matchCount >= 2) {
      // Check for size mismatch (don't match 60ct to 100ct or japanese to standard)
      const dbIsJapanese =
        dbName.toLowerCase().includes("japanese") ||
        dbName.toLowerCase().includes("60ct");
      const shopIsJapanese =
        shopifyTitle.toLowerCase().includes("japanese") ||
        shopifyTitle.toLowerCase().includes("60ct");

      if (dbIsJapanese !== shopIsJapanese) return 0;

      // Check for inner/outer/perfect fit mismatch
      const dbIsInner =
        dbName.toLowerCase().includes("inner") ||
        dbName.toLowerCase().includes("perfect fit");
      const shopIsInner =
        shopifyTitle.toLowerCase().includes("inner") ||
        shopifyTitle.toLowerCase().includes("perfect fit");
      if (dbIsInner !== shopIsInner) return 0;

      const dbIsOuter = dbName.toLowerCase().includes("outer");
      const shopIsOuter = shopifyTitle.toLowerCase().includes("outer");
      if (dbIsOuter !== shopIsOuter) return 0;

      return 30 + matchRatio * 50;
    }
  }

  // Generic keyword matching for other products
  const dbWords = dbNorm.split(" ").filter((w) => w.length > 2);
  const shopWords = shopNorm.split(" ").filter((w) => w.length > 2);

  if (dbWords.length === 0) return 0;

  let wordMatches = 0;
  for (const w of dbWords) {
    if (shopWords.includes(w)) wordMatches++;
  }

  const wordRatio = wordMatches / dbWords.length;
  if (wordRatio >= 0.6 && wordMatches >= 3) {
    return 20 + wordRatio * 40;
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Fetch all Shopify products with pagination
// ---------------------------------------------------------------------------

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  let page = 1;

  console.log("Fetching products from ginzatcg.com Shopify store...\n");

  while (true) {
    const url = `https://www.ginzatcg.com/products.json?limit=250&page=${page}`;
    console.log(`  Fetching page ${page}...`);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const data = (await res.json()) as ShopifyResponse;

      if (!data.products || data.products.length === 0) {
        console.log(
          `  Page ${page} returned 0 products -- done paginating.`
        );
        break;
      }

      console.log(`  Got ${data.products.length} products from page ${page}.`);
      allProducts.push(...data.products);
      page++;
      await sleep(500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\nError fetching (page ${page}): ${msg}`);
      if (page === 1) return [];
      break;
    }
  }

  console.log(`\nTotal Shopify products fetched: ${allProducts.length}\n`);
  return allProducts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // 1. Fetch Shopify products
  const shopifyProducts = await fetchShopifyProducts();
  if (shopifyProducts.length === 0) {
    console.log("No Shopify products available. Exiting.");
    return;
  }

  // Build entries with images
  const shopifyEntries = shopifyProducts
    .filter((sp) => sp.images && sp.images.length > 0)
    .map((sp) => ({
      title: sp.title,
      handle: sp.handle,
      imageSrc: sp.images[0].src,
      normalized: normalize(sp.title),
    }));

  console.log(`Shopify products with images: ${shopifyEntries.length}\n`);

  // 2. Get DB products still missing images
  const dbProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      images: { isEmpty: true },
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  console.log(`DB products still missing images: ${dbProducts.length}\n`);

  if (dbProducts.length === 0) {
    console.log("All published products already have images!");
    return;
  }

  // 3. Score-based matching
  let matchedCount = 0;
  let updatedCount = 0;
  const unmatched: { name: string; category: string }[] = [];
  const matched: { dbName: string; shopifyName: string; score: number }[] = [];

  for (const product of dbProducts) {
    let bestScore = 0;
    let bestEntry: (typeof shopifyEntries)[0] | null = null;

    for (const entry of shopifyEntries) {
      const score = scoreMatch(product.name, entry.title, product.category);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    // Minimum score threshold
    if (bestEntry && bestScore >= 30) {
      matchedCount++;
      matched.push({
        dbName: product.name,
        shopifyName: bestEntry.title,
        score: bestScore,
      });

      console.log(
        `MATCH (score ${bestScore.toFixed(0)}): "${product.name}"`
      );
      console.log(`    -> "${bestEntry.title}"`);

      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: [bestEntry.imageSrc] },
        });
        updatedCount++;
        console.log(`    [UPDATED]\n`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`    [UPDATE FAILED]: ${msg}\n`);
      }
    } else {
      unmatched.push({ name: product.name, category: product.category });
      console.log(
        `NO MATCH: "${product.name}" (${product.category})${
          bestEntry ? ` [best: "${bestEntry.title}" score=${bestScore.toFixed(0)}]` : ""
        }`
      );
    }
  }

  // 4. Summary
  console.log("\n========================================");
  console.log("V2 MATCHING SUMMARY");
  console.log("========================================");
  console.log(`Total DB products missing images: ${dbProducts.length}`);
  console.log(`Matched:   ${matchedCount}`);
  console.log(`Updated:   ${updatedCount}`);
  console.log(`Still unmatched: ${unmatched.length}`);
  console.log("========================================\n");

  // Show matches sorted by score
  if (matched.length > 0) {
    console.log("Matches made:");
    for (const m of matched.sort((a, b) => a.score - b.score)) {
      console.log(
        `  [${m.score.toFixed(0)}] "${m.dbName}" -> "${m.shopifyName}"`
      );
    }
    console.log();
  }

  // 5. Save remaining unmatched to file
  if (unmatched.length > 0) {
    const lines = unmatched.map((u) => `${u.name}  |  ${u.category}`);
    const content = [
      `Unmatched Products V2 (${new Date().toISOString()})`,
      `Total: ${unmatched.length}`,
      "",
      "Name  |  Category",
      "------|----------",
      ...lines,
      "",
    ].join("\n");

    const outPath = path.join(__dirname, "unmatched-products-v2.txt");
    fs.writeFileSync(outPath, content, "utf-8");
    console.log(`Unmatched products saved to: ${outPath}`);
  }
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
