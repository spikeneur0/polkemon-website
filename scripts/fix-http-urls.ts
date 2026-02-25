/**
 * Fix any http:// image URLs to https://
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const products = await db.product.findMany({
    where: { NOT: { images: { equals: [] } } },
    select: { id: true, name: true, images: true },
  });

  let fixed = 0;
  for (const p of products) {
    const hasHttp = p.images.some(img => img.startsWith("http://"));
    if (hasHttp) {
      const fixedImages = p.images.map(img => img.replace("http://", "https://"));
      await db.product.update({
        where: { id: p.id },
        data: { images: fixedImages },
      });
      console.log(`Fixed: ${p.name}`);
      for (const img of p.images) {
        if (img.startsWith("http://")) {
          console.log(`  ${img} → ${img.replace("http://", "https://")}`);
        }
      }
      fixed++;
    }
  }

  console.log(`\nFixed ${fixed} products with http:// URLs`);
  await db.$disconnect();
}

main().catch(console.error);
