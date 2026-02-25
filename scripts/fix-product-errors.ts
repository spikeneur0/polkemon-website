/**
 * Fix product data errors:
 * 1. "Nendroid" → "Nendoroid" (3 products)
 * 2. Add missing dash separators in card names (10 products)
 * 3. Fix Lorcana Whispers in the Well name/description
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("=== Fixing Product Data Errors ===\n");

  // 1. Fix "Nendroid" → "Nendoroid"
  console.log("--- Fix #1: Nendroid → Nendoroid ---");
  const nendroids = await db.product.findMany({
    where: { name: { contains: "Nendroid" } },
    select: { id: true, name: true, slug: true, description: true },
  });

  for (const p of nendroids) {
    const newName = p.name.replace("Nendroid", "Nendoroid");
    const newSlug = p.slug.replace("nendroid", "nendoroid");
    const newDesc = p.description.replace("Nendroid", "Nendoroid");

    await db.product.update({
      where: { id: p.id },
      data: { name: newName, slug: newSlug, description: newDesc },
    });
    console.log(`  ✓ ${p.name} → ${newName}`);
    console.log(`    slug: ${p.slug} → ${newSlug}`);
  }

  // 2. Fix missing dash separators in card names
  console.log("\n--- Fix #2: Add missing dash separators ---");
  const dashFixes: Record<string, string> = {
    "Brassius SV: Prismatic Evolutions 135/131":
      "Brassius - SV: Prismatic Evolutions 135/131",
    "Eldegoss V Champion's Path 05/73":
      "Eldegoss V - Champion's Path 05/73",
    "Hisuian Lilligant V SWSH10: Astral Radiance 017/189":
      "Hisuian Lilligant V - SWSH10: Astral Radiance 017/189",
    "Jirachi GX smM: Tag Team GX Starter Sets 002/031":
      "Jirachi GX - smM: Tag Team GX Starter Sets 002/031",
    "Kricketune V SWSH05: Battle Styles 006/163":
      "Kricketune V - SWSH05: Battle Styles 006/163",
    "Maximum Belt SV: Prismatic Evolutions 117/131":
      "Maximum Belt - SV: Prismatic Evolutions 117/131",
    "Mewtwo GX smL: Sun & Moon Family 025/051":
      "Mewtwo GX - smL: Sun & Moon Family 025/051",
    "Radiant Venusaur S10b: Pokemon GO 004/071":
      "Radiant Venusaur - S10b: Pokemon GO 004/071",
    "Raifort SV: Prismatic Evolutions 142/131":
      "Raifort - SV: Prismatic Evolutions 142/131",
  };
  // Note: "Lamiamon [BT24-016]" is Digimon format with bracket notation — different convention, left as-is

  for (const [oldName, newName] of Object.entries(dashFixes)) {
    const product = await db.product.findFirst({
      where: { name: oldName },
      select: { id: true, name: true, description: true },
    });

    if (product) {
      // Also update description if it starts with the old name
      const newDesc = product.description.startsWith(oldName)
        ? product.description.replace(oldName, newName)
        : product.description;

      await db.product.update({
        where: { id: product.id },
        data: { name: newName, description: newDesc },
      });
      console.log(`  ✓ ${oldName} → ${newName}`);
    } else {
      console.log(`  ✗ Not found: ${oldName}`);
    }
  }

  // 3. Fix Lorcana Whispers in the Well
  console.log("\n--- Fix #3: Lorcana Whispers in the Well ---");
  const lorcana = await db.product.findFirst({
    where: { slug: "lorcana-whispers-in-the-well" },
    select: { id: true, name: true, slug: true, description: true },
  });

  if (lorcana) {
    const newName = "Lorcana: Whispers in the Well - Illumineer's Trove";
    const newSlug = "lorcana-whispers-in-the-well-illumineers-trove";
    const newDesc =
      "Lorcana: Whispers in the Well - Illumineer's Trove. A premium collector's set featuring booster packs, accessories, and exclusive storage. Sealed and authentic.";

    await db.product.update({
      where: { id: lorcana.id },
      data: { name: newName, slug: newSlug, description: newDesc },
    });
    console.log(`  ✓ ${lorcana.name} → ${newName}`);
    console.log(`    slug: ${lorcana.slug} → ${newSlug}`);
    console.log(`    description updated`);
  }

  // Summary
  const total = await db.product.count();
  console.log(`\nDone! ${total} total products.`);

  await db.$disconnect();
}

main().catch(console.error);
