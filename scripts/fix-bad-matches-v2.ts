import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const BAD = [
  "Stickers (17 variants)",   // matched to My Hero Academia sticker - wrong
  "Pokémon: Sun & Moon",      // matched to Mewtwo GX single card - wrong
];

async function main() {
  for (const name of BAD) {
    const r = await db.product.updateMany({
      where: { name },
      data: { images: [] },
    });
    if (r.count > 0) console.log(`Cleared: ${name}`);
  }

  const total = await db.product.count();
  const withImages = await db.product.count({
    where: { NOT: { images: { equals: [] } } },
  });
  console.log(`\nFinal: ${withImages}/${total} products have images (${((withImages / total) * 100).toFixed(1)}%)`);
  await db.$disconnect();
}

main();
