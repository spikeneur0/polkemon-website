/**
 * fix-bad-matches-v3.ts
 *
 * Reverts incorrect image matches from the v2 fuzzy matching script.
 * These are products where the score was too low and the match was wrong.
 *
 * Usage: npx tsx scripts/fix-bad-matches-v3.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Products that were incorrectly matched — clear their images back to []
const BAD_MATCHES = [
  // Dragon Shield wrong color matches (matched to Scalding Tarn or wrong color)
  "Dragon Shield: Crimson (Matte) 100ct",
  "Dragon Shield: Arid Mesa (Dual Matte) 100ct",
  "Dragon Shield: Verdant Catacombs (Dual Matte) 100ct",
  "Dragon Shield: The Ur-Dragon (Dual Matte) 100ct",
  "Dragonshield: Copper Matte 100CT",
  "Dragon Shield: Amethyst Japanese 60ct",

  // Coke (drink) matched to Labubu Coke figure
  "Coke",

  // Wrong products matched (different set/type)
  "Pokémon: Team Rocket Tins",
  "One Piece: EB04 JPN",
  "Enamel Pins",
  "Freiren: Beyond Journey's End Keychain",

  // MTG wrong set matches
  "Magic: The Gathering: Universes Beyond Fallout Commander Decks",
  "Magic: The Gathering: Murders at Karlov Manor Commander Decks",
  "Magic: The Gathering: Phyrexia All Will Be One - Set Booster Pack",
  "Magic: The Gathering: Urza Saga Booster Pack",

  // Weiss Schwarz wrong product
  "Weiss Schwarz: Persona 3 Reload Premium Booster",
];

async function main() {
  console.log("Reverting bad image matches...\n");

  let fixed = 0;
  for (const name of BAD_MATCHES) {
    const result = await prisma.product.updateMany({
      where: { name },
      data: { images: [] },
    });

    if (result.count > 0) {
      console.log(`  REVERTED: "${name}" (${result.count} row(s))`);
      fixed += result.count;
    } else {
      console.log(`  NOT FOUND: "${name}"`);
    }
  }

  console.log(`\nDone. Reverted ${fixed} bad matches.`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
