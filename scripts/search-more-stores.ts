/**
 * Search additional specialized stores for remaining missing images
 * Focus on: Gundam models, Japanese snacks, card supplies, anime merch
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface ShopifyImage {
  src: string;
  position: number;
}

interface ShopifyProduct {
  title: string;
  handle: string;
  images: ShopifyImage[];
}

// More specialized Shopify stores
const SHOPIFY_STORES = [
  // Gundam/Models
  "https://usagundamstore.com",
  "https://newtypehq.com",
  "https://galactictoys.com",
  "https://gundamit.com",
  // Japanese snacks/drinks
  "https://japancandystore.com",
  "https://sugoimart.com",
  "https://bokksu.com",
  "https://weebotaku.com",
  // Card supplies / TCG
  "https://cardcollective.com.au",
  "https://www.gamersguildaz.com",
  // Anime merch general
  "https://otakumode.com",
  "https://store.crunchyroll.com",
  "https://www.bigbadtoystore.com",
  "https://www.rightstufanime.com",
  // More TCG stores
  "https://www.miniaturemarket.com",
  "https://www.sagaconcepts.com",
  "https://www.southernhobby.com",
];

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(" ").filter(w => w.length > 1));
  const wordsB = new Set(normalize(b).split(" ").filter(w => w.length > 1));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

async function fetchShopifyProducts(storeUrl: string): Promise<ShopifyProduct[]> {
  const allProducts: ShopifyProduct[] = [];
  try {
    for (let page = 1; page <= 10; page++) {
      const url = `${storeUrl}/products.json?limit=250&page=${page}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      clearTimeout(timeout);
      if (!res.ok) break;
      const data = await res.json();
      if (!data.products || data.products.length === 0) break;
      allProducts.push(...data.products);
    }
  } catch (e) {
    // Ignore - store might not be Shopify
  }
  return allProducts;
}

async function main() {
  console.log("=== Searching More Stores for Missing Images ===\n");

  const missing = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { id: true, name: true, slug: true, category: true },
  });
  console.log(`Products still missing images: ${missing.length}\n`);

  // Collect all products from stores
  const allStoreProducts: ShopifyProduct[] = [];

  for (const store of SHOPIFY_STORES) {
    process.stdout.write(`Fetching from ${store}... `);
    const products = await fetchShopifyProducts(store);
    if (products.length > 0) {
      const withImages = products.filter(p => p.images.length > 0);
      console.log(`${products.length} products (${withImages.length} with images)`);
      allStoreProducts.push(...withImages);
    } else {
      console.log("no products / not Shopify");
    }
  }

  console.log(`\nTotal store products with images: ${allStoreProducts.length}\n`);

  let matched = 0;
  const unmatched: string[] = [];

  for (const product of missing) {
    let bestMatch: ShopifyProduct | null = null;
    let bestScore = 0;

    for (const sp of allStoreProducts) {
      const score = similarity(product.name, sp.title);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sp;
      }
    }

    if (bestMatch && bestScore >= 0.5) {
      const imageUrls = bestMatch.images
        .sort((a, b) => a.position - b.position)
        .map((img) => img.src);

      await db.product.update({
        where: { id: product.id },
        data: { images: imageUrls },
      });

      matched++;
      console.log(`  ✓ [${bestScore.toFixed(2)}] "${product.name}" → "${bestMatch.title}"`);
    } else {
      unmatched.push(`[${product.category}] ${product.name} (best: "${bestMatch?.title || 'none'}" @ ${bestScore.toFixed(2)})`);
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log(`\nStill unmatched:`);
    for (const u of unmatched) {
      console.log(`  ${u}`);
    }
  }

  const total = await db.product.count();
  const withImages = await db.product.count({
    where: { NOT: { images: { equals: [] } } },
  });
  console.log(`\nFinal: ${withImages}/${total} products have images (${((withImages / total) * 100).toFixed(1)}%)`);

  await db.$disconnect();
}

main().catch(console.error);
