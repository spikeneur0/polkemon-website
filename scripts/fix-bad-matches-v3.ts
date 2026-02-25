/**
 * Fix incorrect image matches from targeted search
 * These products got matched to wrong products
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Products that got wrong images - need to be reverted
const BAD_MATCHES = [
  "devil-fruit-bracelet",          // Matched to "Devil Fruit Accessory Pouch Bag" - wrong product type
  "yu-gi-oh-dragons-of-legends-2", // Matched to a single card, not the booster pack
  "coke",                           // Matched to "Coke Plus" - different product
  "ucc-matcha-latte",              // Matched to "Koeda Chocolate - Matcha Latte" - wrong product
  "archeops-master-ball-pattern-sv11w",  // Matched to "Master Ball Plush" - completely wrong
  "purrloin-master-ball-pattern-sv11w",  // Matched to "Master Ball Plush" - completely wrong
];

async function main() {
  console.log("=== Reverting Bad Matches ===\n");

  for (const slug of BAD_MATCHES) {
    const product = await db.product.findFirst({
      where: { slug },
      select: { id: true, name: true, images: true },
    });

    if (product && product.images.length > 0) {
      await db.product.update({
        where: { id: product.id },
        data: { images: [] },
      });
      console.log(`  Reverted: ${product.name} (had ${product.images.length} image(s))`);
    } else {
      console.log(`  Skipped: ${slug} (${product ? 'no images' : 'not found'})`);
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
