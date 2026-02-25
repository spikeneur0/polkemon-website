/**
 * Scrape missing product images from ginzatcg.com
 *
 * This script:
 * 1. Fetches all products from ginzatcg.com's public Shopify JSON API
 * 2. Finds products in our DB that are missing images
 * 3. Matches them by name similarity to the reference site
 * 4. Updates our DB with the matched image URLs
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface ShopifyImage {
  id: number;
  src: string;
  position: number;
  width: number;
  height: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  images: ShopifyImage[];
  product_type: string;
  tags: string[];
}

// Normalize a product name for matching
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate similarity between two strings (Jaccard index on words)
function similarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(" "));
  const wordsB = new Set(normalize(b).split(" "));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

async function fetchGinzaProducts(): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];

  for (let page = 1; page <= 3; page++) {
    const url = `https://www.ginzatcg.com/products.json?limit=250&page=${page}`;
    console.log(`Fetching page ${page}...`);
    const res = await fetch(url);
    const data = await res.json();

    if (!data.products || data.products.length === 0) break;
    allProducts.push(...data.products);
    console.log(`  Got ${data.products.length} products (total: ${allProducts.length})`);
  }

  return allProducts;
}

async function main() {
  console.log("=== Scraping Missing Product Images ===\n");

  // 1. Fetch all products from ginzatcg.com
  const ginzaProducts = await fetchGinzaProducts();
  console.log(`\nTotal ginza products: ${ginzaProducts.length}`);

  // Only keep products that have images
  const ginzaWithImages = ginzaProducts.filter(p => p.images.length > 0);
  console.log(`Ginza products with images: ${ginzaWithImages.length}`);

  // 2. Get our products that are missing images
  const ourProducts = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { id: true, name: true, slug: true, category: true },
  });
  console.log(`\nOur products missing images: ${ourProducts.length}`);

  // 3. Build a lookup map of ginza products by normalized name
  // Also index by handle for exact slug matches
  const ginzaByHandle = new Map<string, ShopifyProduct>();
  for (const gp of ginzaWithImages) {
    ginzaByHandle.set(gp.handle, gp);
  }

  // 4. Match and update
  let matched = 0;
  let unmatched = 0;
  const unmatchedProducts: string[] = [];

  for (const product of ourProducts) {
    // Try exact handle/slug match first
    let bestMatch: ShopifyProduct | null = null;

    // Our slugs may have been generated differently, so try direct match
    const directMatch = ginzaByHandle.get(product.slug);
    if (directMatch) {
      bestMatch = directMatch;
    } else {
      // Try fuzzy name matching
      let bestScore = 0;
      for (const gp of ginzaWithImages) {
        const score = similarity(product.name, gp.title);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = gp;
        }
      }

      // Only accept matches with high enough similarity
      if (bestScore < 0.5) {
        bestMatch = null;
      }
    }

    if (bestMatch && bestMatch.images.length > 0) {
      // Get all image URLs, sorted by position
      const imageUrls = bestMatch.images
        .sort((a, b) => a.position - b.position)
        .map(img => img.src);

      await db.product.update({
        where: { id: product.id },
        data: { images: imageUrls },
      });

      matched++;
      if (matched % 20 === 0) {
        console.log(`  Matched ${matched} so far...`);
      }
    } else {
      unmatched++;
      unmatchedProducts.push(`[${product.category}] ${product.name}`);
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Matched and updated: ${matched}`);
  console.log(`Could not match: ${unmatched}`);

  if (unmatchedProducts.length > 0 && unmatchedProducts.length <= 50) {
    console.log(`\nUnmatched products:`);
    for (const p of unmatchedProducts) {
      console.log(`  ${p}`);
    }
  }

  // Final count
  const remainingNoImages = await db.product.count({ where: { images: { equals: [] } } });
  const totalWithImages = await db.product.count({ where: { NOT: { images: { equals: [] } } } });
  console.log(`\nFinal state:`);
  console.log(`  Products with images: ${totalWithImages}`);
  console.log(`  Products still without images: ${remainingNoImages}`);

  await db.$disconnect();
}

main().catch(console.error);
