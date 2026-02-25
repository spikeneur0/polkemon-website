/**
 * Revert bad image matches from the aggressive second pass.
 * These products were matched to wrong products (different items).
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Products that got wrong images in the second pass
const BAD_MATCHES = [
  "Pokémon: Sun & Moon",                    // matched to 151, wrong product
  "Pokémon: UPC Playmat",                   // matched to 151, wrong product
  "Pokémon: Match Battle Pack",             // matched to Fossil Booster Pack
  "Pokémon: Eevee Keychain",               // matched to Eevee Heroes card set
  "Magic: The Gathering: Phyrexia All Will Be One - Set Booster Pack", // matched to Spiderman
  "Yu-Gi-Oh: Dragons of Legends 2",        // matched to Brothers of Legend
  "Weiss Schwarz: Persona 3 Reload Premium Booster", // matched to Marvel
  "Pokémon: Team Rocket Tins",             // matched to SV10 Glory of Team Rocket (different)
];

async function main() {
  console.log("Reverting bad image matches...\n");

  for (const name of BAD_MATCHES) {
    const result = await db.product.updateMany({
      where: { name },
      data: { images: [] },
    });
    if (result.count > 0) {
      console.log(`  ✓ Cleared images for: ${name}`);
    } else {
      console.log(`  - Not found: ${name}`);
    }
  }

  // Final stats
  const total = await db.product.count();
  const withImages = await db.product.count({
    where: { NOT: { images: { equals: [] } } },
  });
  console.log(
    `\nFinal: ${withImages}/${total} products have images (${((withImages / total) * 100).toFixed(1)}%)`
  );

  await db.$disconnect();
}

main().catch(console.error);
