import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const all = await db.product.findMany({
    where: { NOT: { images: { equals: [] } } },
    select: { images: true },
  });

  const counts: Record<string, number> = {};
  for (const p of all) {
    for (const img of p.images) {
      try {
        const url = new URL(img);
        counts[url.hostname] = (counts[url.hostname] || 0) + 1;
      } catch {
        counts["INVALID"] = (counts["INVALID"] || 0) + 1;
      }
    }
  }

  console.log("Image URL domains:");
  for (const [domain, count] of Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${domain}: ${count}`);
  }

  await db.$disconnect();
}

main();
