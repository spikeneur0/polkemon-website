import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const missing = await prisma.product.findMany({
    where: { isPublished: true, images: { isEmpty: true } },
    select: { name: true, category: true },
    orderBy: { category: "asc" },
  });
  console.log("Products still missing images: " + missing.length);
  let currentCat = "";
  for (const p of missing) {
    if (p.category !== currentCat) {
      currentCat = p.category;
      console.log("\n=== " + currentCat + " ===");
    }
    console.log("  " + p.name);
  }
}
main().finally(() => prisma.$disconnect());
