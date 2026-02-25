/**
 * Search ginzatcg.com products JSON for specific products still missing images.
 * Uses broader search terms and manual matching.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface ShopifyProduct {
  title: string;
  handle: string;
  images: Array<{ src: string; position: number }>;
  product_type: string;
}

async function fetchAllProducts(): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(
      `https://www.ginzatcg.com/products.json?limit=250&page=${page}`
    );
    const data = await res.json();
    if (!data.products || data.products.length === 0) break;
    all.push(...data.products);
  }
  return all;
}

// Manual mapping: our product name -> search terms to find on ginzatcg
const MANUAL_MATCHES: Record<string, string[]> = {
  "Pokémon: Sun & Moon": ["sun-moon", "sun & moon"],
  "Pokémon: Team Rocket Tins": ["team rocket tin", "team-rocket-tin"],
  "Pokémon: Starter Set ex Terastal Stellar Ceruledge": ["ceruledge", "terastal stellar"],
  "Pokémon: Match Battle Pack": ["match battle"],
  "Yu-Gi-Oh: Phantom Revenge": ["phantom revenge"],
  "Yu-Gi-Oh: Dragons of Legends 2": ["dragons of legend"],
  "Weiss Schwarz: Dandandan": ["dandandan"],
  "Weiss Schwarz: Persona 3 Reload Premium Booster": ["persona 3"],
  "Digimon: X Record Booster Pack (BT09)": ["x record", "bt09"],
  "Pokémon: UPC Playmat": ["upc playmat"],
  "Gift Cards": ["gift card", "gift-card"],
  "Archeops - (Master Ball Pattern) SV11W": ["archeops"],
  "Purrloin - (Master Ball Pattern) SV11W": ["purrloin"],
  "Stickers (17 variants)": ["sticker"],
  "Shadowverse: Umamusume Crossover Set": ["umamusume crossover"],
  "Shadowverse: BANQUEST OF DREAMS": ["banquest"],
};

async function main() {
  console.log("=== Searching for specific missing products ===\n");

  const ginza = await fetchAllProducts();
  console.log(`Fetched ${ginza.length} products from ginzatcg.com`);

  // Get our products still missing images
  const missing = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { id: true, name: true, slug: true },
  });
  console.log(`Our products still missing: ${missing.length}\n`);

  // For each product in our manual map, search ginzatcg
  let updated = 0;
  for (const product of missing) {
    const searchTerms = MANUAL_MATCHES[product.name];
    if (!searchTerms) continue;

    let found: ShopifyProduct | null = null;
    for (const gp of ginza) {
      const titleLower = gp.title.toLowerCase();
      const handleLower = gp.handle.toLowerCase();
      for (const term of searchTerms) {
        if (titleLower.includes(term) || handleLower.includes(term)) {
          if (gp.images.length > 0) {
            found = gp;
            break;
          }
        }
      }
      if (found) break;
    }

    if (found) {
      const imageUrls = found.images
        .sort((a, b) => a.position - b.position)
        .map((img) => img.src);

      await db.product.update({
        where: { id: product.id },
        data: { images: imageUrls },
      });
      updated++;
      console.log(`  ✓ "${product.name}" → "${found.title}"`);
    } else {
      console.log(`  ✗ "${product.name}" - no match on ginzatcg.com`);
    }
  }

  // Also list ALL ginza products to look for patterns
  console.log("\n--- Products on ginzatcg.com that have no images ---");
  const noImage = ginza.filter((p) => p.images.length === 0);
  for (const p of noImage) {
    console.log(`  [no-image] ${p.title} (${p.handle})`);
  }

  console.log(`\nUpdated ${updated} additional products`);

  const total = await db.product.count();
  const withImages = await db.product.count({
    where: { NOT: { images: { equals: [] } } },
  });
  console.log(
    `Final: ${withImages}/${total} products have images (${((withImages / total) * 100).toFixed(1)}%)`
  );

  await db.$disconnect();
}

main().catch(console.error);
