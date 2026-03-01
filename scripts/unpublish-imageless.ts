/**
 * unpublish-imageless.ts
 *
 * Unpublishes all published products that have no images.
 * These can be re-published once the store owner adds proper product photos.
 *
 * Usage: npx tsx scripts/unpublish-imageless.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Find all published products with no images
  const noImages = await prisma.product.findMany({
    where: {
      isPublished: true,
      images: { isEmpty: true },
    },
    select: { id: true, name: true, category: true },
    orderBy: { category: "asc" },
  });

  console.log(`Found ${noImages.length} published products with no images.\n`);

  if (noImages.length === 0) {
    console.log("Nothing to do — all published products have images!");
    return;
  }

  // 2. Unpublish them
  const ids = noImages.map((p) => p.id);
  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { isPublished: false },
  });

  console.log(`Unpublished ${result.count} products.\n`);

  // 3. Print what was unpublished
  let currentCat = "";
  for (const p of noImages) {
    if (p.category !== currentCat) {
      currentCat = p.category;
      console.log(`\n--- ${currentCat} ---`);
    }
    console.log(`  ${p.name}`);
  }

  // 4. Final count
  const totalPublished = await prisma.product.count({
    where: { isPublished: true },
  });
  const totalWithImages = await prisma.product.count({
    where: { isPublished: true, NOT: { images: { isEmpty: true } } },
  });

  console.log(`\n========================================`);
  console.log(`Total published products: ${totalPublished}`);
  console.log(`Published with images: ${totalWithImages}`);
  console.log(`Published without images: ${totalPublished - totalWithImages}`);
  console.log(`========================================`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
