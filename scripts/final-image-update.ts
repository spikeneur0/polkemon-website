/**
 * Final image update - set specific known URLs for remaining products
 * and check all image domains used
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Manually verified correct image URLs
const MANUAL_IMAGES: Record<string, string[]> = {
  // Yu-Gi-Oh: Dragons of Legends 2 - official Konami image
  "yu-gi-oh-dragons-of-legends-2": [
    "https://www.yugioh-card.com/en/wp-content/uploads/2023/03/DRG2_lrg.png",
  ],
};

async function main() {
  console.log("=== Final Image Update ===\n");

  // Apply manual images
  let updated = 0;
  for (const [slug, images] of Object.entries(MANUAL_IMAGES)) {
    const product = await db.product.findFirst({
      where: { slug },
      select: { id: true, name: true, images: true },
    });

    if (product) {
      if (product.images.length === 0) {
        await db.product.update({
          where: { id: product.id },
          data: { images },
        });
        console.log(`  ✓ Updated: ${product.name}`);
        updated++;
      } else {
        console.log(`  - Skipped (already has images): ${product.name}`);
      }
    }
  }
  console.log(`\nManual updates: ${updated}`);

  // Check all image domains used
  const allProducts = await db.product.findMany({
    where: { NOT: { images: { equals: [] } } },
    select: { images: true },
  });

  const domains: Record<string, number> = {};
  for (const p of allProducts) {
    for (const img of p.images) {
      try {
        const url = new URL(img);
        domains[url.hostname] = (domains[url.hostname] || 0) + 1;
      } catch {
        domains["INVALID"] = (domains["INVALID"] || 0) + 1;
      }
    }
  }

  console.log("\nImage domains used:");
  for (const [domain, count] of Object.entries(domains).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${domain}: ${count}`);
  }

  // List remaining products without images
  const remaining = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { name: true, slug: true, category: true },
    orderBy: { category: "asc" },
  });

  if (remaining.length > 0) {
    console.log(`\nStill missing (${remaining.length}):`);
    for (const p of remaining) {
      console.log(`  [${p.category}] ${p.name}`);
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
