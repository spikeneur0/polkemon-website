import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const missing = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { name: true, slug: true, category: true },
    orderBy: { category: "asc" },
  });

  console.log(`Still missing images (${missing.length}):`);
  for (const p of missing) {
    console.log(`  [${p.category}] ${p.name}`);
  }

  const cats = await db.product.groupBy({
    by: ["category"],
    where: { images: { equals: [] } },
    _count: true,
    orderBy: { _count: { category: "desc" } },
  });

  console.log("\nBy category:");
  for (const c of cats) {
    console.log(`  ${c.category}: ${c._count}`);
  }

  await db.$disconnect();
}

main();
