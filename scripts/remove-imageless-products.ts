/**
 * Remove products that have no images and are store-specific/generic items
 * that can't be found online.
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("=== Removing Products Without Images ===\n");

  // Get all products without images
  const noImages = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { id: true, name: true, slug: true, category: true, price: true },
    orderBy: { category: "asc" },
  });

  console.log(`Products without images to remove: ${noImages.length}\n`);

  for (const p of noImages) {
    console.log(`  [${p.category}] ${p.name} ($${(p.price / 100).toFixed(2)})`);
  }

  // Delete them
  const result = await db.product.deleteMany({
    where: { images: { equals: [] } },
  });

  console.log(`\nDeleted: ${result.count} products`);

  // Final stats
  const total = await db.product.count();
  const withImages = await db.product.count({
    where: { NOT: { images: { equals: [] } } },
  });
  console.log(`\nRemaining: ${total} products (${withImages} with images)`);

  await db.$disconnect();
}

main().catch(console.error);
