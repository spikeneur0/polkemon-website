import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // First check for any order items referencing these products
  const imageless = await prisma.product.findMany({
    where: { images: { isEmpty: true } },
    select: { id: true, name: true, category: true },
    orderBy: { category: "asc" },
  });

  console.log(`Found ${imageless.length} products with no images.\n`);

  if (imageless.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  const ids = imageless.map((p) => p.id);

  // Check for order items referencing these products
  const orderItems = await prisma.orderItem.count({
    where: { productId: { in: ids } },
  });

  if (orderItems > 0) {
    console.log(`⚠️  ${orderItems} order items reference these products.`);
    console.log("Nullifying product references on order items first...");
    await prisma.orderItem.updateMany({
      where: { productId: { in: ids } },
      data: { productId: null },
    });
    console.log("Done.\n");
  }

  // Delete the products
  const result = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`Deleted ${result.count} products.\n`);

  let currentCat = "";
  for (const p of imageless) {
    if (p.category !== currentCat) {
      currentCat = p.category;
      console.log(`\n--- ${currentCat} ---`);
    }
    console.log(`  ${p.name}`);
  }

  const remaining = await prisma.product.count();
  const published = await prisma.product.count({ where: { isPublished: true } });
  console.log(`\n========================================`);
  console.log(`Total products remaining: ${remaining}`);
  console.log(`Published: ${published}`);
  console.log(`========================================`);
}

main()
  .catch((err) => { console.error("Fatal error:", err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
