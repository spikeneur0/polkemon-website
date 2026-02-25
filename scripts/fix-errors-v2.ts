/**
 * Fix product data errors (v2):
 * 1. Standardize "Pokémon" → "Pokemon" and "Pokéball" → "Pokeball" in all names/descriptions
 * 2. Regenerate broken slugs (pokmon → pokemon, pokball → pokeball)
 * 3. Fix 2 broken product images (Team Rocket Tins, M3 Nullifying Zero)
 * 4. Fix "Dragonshield" → "Dragon Shield" (9 products) with consistent colon formatting
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function main() {
  console.log("=== Fixing Product Data Errors (v2) ===\n");

  // -------------------------------------------------------
  // 1. Standardize Pokémon → Pokemon, Pokéball → Pokeball
  // -------------------------------------------------------
  console.log("--- Fix #1: Standardize Pokémon → Pokemon ---");
  const accentedProducts = await db.product.findMany({
    where: {
      OR: [
        { name: { contains: "Pokémon" } },
        { name: { contains: "Pokéball" } },
        { description: { contains: "Pokémon" } },
        { description: { contains: "Pokéball" } },
      ],
    },
    select: { id: true, name: true, slug: true, description: true },
  });

  console.log(`  Found ${accentedProducts.length} products with accented characters`);
  let nameFixed = 0;
  let slugFixed = 0;

  for (const p of accentedProducts) {
    const newName = p.name.replace(/Pokémon/g, "Pokemon").replace(/Pokéball/g, "Pokeball");
    const newDesc = p.description.replace(/Pokémon/g, "Pokemon").replace(/Pokéball/g, "Pokeball");
    const newSlug = slugify(newName);

    const updates: Record<string, string> = {};
    if (newName !== p.name) {
      updates.name = newName;
      nameFixed++;
    }
    if (newDesc !== p.description) {
      updates.description = newDesc;
    }
    if (newSlug !== p.slug) {
      updates.slug = newSlug;
      slugFixed++;
    }

    if (Object.keys(updates).length > 0) {
      await db.product.update({ where: { id: p.id }, data: updates });
      if (newSlug !== p.slug) {
        console.log(`  ✓ ${p.name} → ${newName}`);
        console.log(`    slug: ${p.slug} → ${newSlug}`);
      }
    }
  }
  console.log(`  Names fixed: ${nameFixed}, Slugs fixed: ${slugFixed}`);

  // -------------------------------------------------------
  // 2. Fix broken product images
  // -------------------------------------------------------
  console.log("\n--- Fix #2: Replace broken images ---");

  const imageUpdates: Record<string, string[]> = {
    // Team Rocket Tins - old pokemon.com URL is dead, use Shopify CDN
    "pokemon-team-rocket-tins": [
      "https://cdn.shopify.com/s/files/1/0579/0960/8613/files/pokemon-fall-2025-tin-1.png?v=1751044586",
    ],
    // M3 Nullifying Zero - old ginzatcg.com URL is 404, use Shopify CDN
    "pokemon-m3-nullifying-zero-jpn": [
      "https://cdn.shopify.com/s/files/1/0853/4851/6149/files/NihilZeroJP.png?v=1767921053",
    ],
  };

  for (const [slug, images] of Object.entries(imageUpdates)) {
    const product = await db.product.findFirst({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (product) {
      await db.product.update({
        where: { id: product.id },
        data: { images },
      });
      console.log(`  ✓ ${product.name}: replaced broken image`);
    } else {
      console.log(`  ✗ Not found: ${slug}`);
    }
  }

  // -------------------------------------------------------
  // 3. Fix Dragonshield → Dragon Shield
  // -------------------------------------------------------
  console.log("\n--- Fix #3: Dragonshield → Dragon Shield ---");
  const dragonshields = await db.product.findMany({
    where: { name: { contains: "Dragonshield", mode: "insensitive" } },
    select: { id: true, name: true, slug: true, description: true },
  });

  for (const p of dragonshields) {
    let newName = p.name;

    // Fix "Dragonshield:" → "Dragon Shield:"
    newName = newName.replace(/^Dragonshield:\s*/i, "Dragon Shield: ");
    // Fix "Dragonshield " (no colon) → "Dragon Shield: "
    newName = newName.replace(/^Dragonshield\s+/i, "Dragon Shield: ");

    const newSlug = slugify(newName);
    const newDesc = p.description
      .replace(/Dragonshield/gi, "Dragon Shield");

    await db.product.update({
      where: { id: p.id },
      data: { name: newName, slug: newSlug, description: newDesc },
    });
    console.log(`  ✓ ${p.name} → ${newName}`);
    if (newSlug !== p.slug) {
      console.log(`    slug: ${p.slug} → ${newSlug}`);
    }
  }

  // -------------------------------------------------------
  // Summary
  // -------------------------------------------------------
  const total = await db.product.count();
  console.log(`\nDone! ${total} total products.`);

  // Verify no broken slugs remain
  const remaining = await db.product.count({
    where: {
      OR: [
        { slug: { contains: "pokmon" } },
        { slug: { contains: "pokball" } },
      ],
    },
  });
  console.log(`Remaining broken slugs: ${remaining}`);

  // Verify no accented names remain
  const accentedRemaining = await db.product.count({
    where: {
      OR: [
        { name: { contains: "Pokémon" } },
        { name: { contains: "Pokéball" } },
      ],
    },
  });
  console.log(`Remaining accented names: ${accentedRemaining}`);

  // Verify no Dragonshield remains
  const dsRemaining = await db.product.count({
    where: { name: { contains: "Dragonshield", mode: "insensitive" } },
  });
  console.log(`Remaining Dragonshield: ${dsRemaining}`);

  await db.$disconnect();
}

main().catch(console.error);
