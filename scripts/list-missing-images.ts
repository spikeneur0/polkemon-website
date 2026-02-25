import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const missing = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { id: true, name: true, slug: true, category: true, price: true },
    orderBy: { category: "asc" },
  });

  for (const p of missing) {
    console.log(`[${p.category}] ${p.name} (${p.slug}) - $${(p.price / 100).toFixed(2)} - ID: ${p.id}`);
  }
  console.log(`\nTotal missing: ${missing.length}`);

  // Group by category
  const byCategory: Record<string, number> = {};
  for (const p of missing) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  }
  console.log("\nBy category:");
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  await db.$disconnect();
}

main().catch(console.error);
