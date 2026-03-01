/**
 * fetch-missing-images.ts
 *
 * Fetches product images from ginzatcg.com (Shopify) and matches them
 * to local DB products that are missing images, then updates the DB.
 *
 * Usage: npx tsx scripts/fetch-missing-images.ts
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
  images: ShopifyImage[];
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
 * Fuzzy match: returns true when one normalized name contains the other
 * AND the shorter string is at least 60% the length of the longer one.
 */
function fuzzyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  if (shorter.length / longer.length < 0.6) return false;
  return longer.includes(shorter);
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

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as ShopifyResponse;

      if (!data.products || data.products.length === 0) {
        console.log(`  Page ${page} returned 0 products -- done paginating.`);
        break;
      }

      console.log(`  Got ${data.products.length} products from page ${page}.`);
      allProducts.push(...data.products);
      page++;

      // polite delay between pages
      await sleep(500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\nError fetching Shopify products (page ${page}): ${msg}`);
      if (page === 1) {
        console.error(
          "Could not reach /products.json -- the store may not expose this endpoint."
        );
        return [];
      }
      // If we already have some products, stop paginating and use what we have.
      console.error("Stopping pagination and using products fetched so far.");
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

  // Build a lookup: normalized name -> first image src
  // Also keep an array for fuzzy matching
  const shopifyMap = new Map<
    string,
    { title: string; imageSrc: string }
  >();
  const shopifyEntries: { normalized: string; title: string; imageSrc: string }[] = [];

  for (const sp of shopifyProducts) {
    if (!sp.images || sp.images.length === 0) continue;
    const norm = normalize(sp.title);
    const imageSrc = sp.images[0].src;
    if (!shopifyMap.has(norm)) {
      shopifyMap.set(norm, { title: sp.title, imageSrc });
    }
    shopifyEntries.push({ normalized: norm, title: sp.title, imageSrc });
  }

  console.log(
    `Shopify products with images (deduplicated by normalized name): ${shopifyMap.size}`
  );
  console.log(`Shopify entries for fuzzy matching: ${shopifyEntries.length}\n`);

  // 2. Get DB products missing images
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

  console.log(`DB products missing images: ${dbProducts.length}\n`);

  if (dbProducts.length === 0) {
    console.log("All published products already have images. Nothing to do.");
    return;
  }

  // 3. Match and update
  let matchedCount = 0;
  let updatedCount = 0;
  const unmatched: { name: string; category: string }[] = [];
  const matches: { dbName: string; shopifyName: string; imageUrl: string }[] = [];

  for (const product of dbProducts) {
    const norm = normalize(product.name);

    // Try exact normalized match first
    let match = shopifyMap.get(norm);

    // Try fuzzy matching if no exact match
    if (!match) {
      for (const entry of shopifyEntries) {
        if (fuzzyMatch(norm, entry.normalized)) {
          match = { title: entry.title, imageSrc: entry.imageSrc };
          break;
        }
      }
    }

    if (match) {
      matchedCount++;
      matches.push({
        dbName: product.name,
        shopifyName: match.title,
        imageUrl: match.imageSrc,
      });

      console.log(`MATCH: "${product.name}"`);
      console.log(`    -> "${match.title}"`);
      console.log(`    -> ${match.imageSrc}`);

      try {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: [match.imageSrc] },
        });
        updatedCount++;
        console.log(`    [UPDATED]\n`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`    [UPDATE FAILED]: ${msg}\n`);
      }
    } else {
      unmatched.push({ name: product.name, category: product.category });
      console.log(`NO MATCH: "${product.name}" (${product.category})`);
    }
  }

  // 4. Summary
  console.log("\n========================================");
  console.log("SUMMARY");
  console.log("========================================");
  console.log(`Total DB products missing images: ${dbProducts.length}`);
  console.log(`Matched:   ${matchedCount}`);
  console.log(`Updated:   ${updatedCount}`);
  console.log(`Unmatched: ${unmatched.length}`);
  console.log("========================================\n");

  // 5. Save unmatched to file
  if (unmatched.length > 0) {
    const lines = unmatched.map((u) => `${u.name}  |  ${u.category}`);
    const content = [
      `Unmatched Products (${new Date().toISOString()})`,
      `Total: ${unmatched.length}`,
      "",
      "Name  |  Category",
      "------|----------",
      ...lines,
      "",
    ].join("\n");

    const outPath = path.join(__dirname, "unmatched-products.txt");
    fs.writeFileSync(outPath, content, "utf-8");
    console.log(`Unmatched products saved to: ${outPath}`);
  } else {
    console.log("All products matched -- no unmatched file written.");
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
