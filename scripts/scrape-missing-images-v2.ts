/**
 * Second pass - more aggressive matching for remaining products without images
 * Uses lower similarity threshold and substring matching
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface ShopifyImage {
  id: number;
  src: string;
  position: number;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  images: ShopifyImage[];
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(" "));
  const wordsB = new Set(normalize(b).split(" "));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

// Check if all significant words from product A appear in product B
function containsAllKeyWords(ourName: string, ginzaName: string): boolean {
  const ourWords = normalize(ourName)
    .split(" ")
    .filter((w) => w.length > 2);
  const ginzaNorm = normalize(ginzaName);
  const matched = ourWords.filter((w) => ginzaNorm.includes(w));
  return matched.length >= ourWords.length * 0.7;
}

async function main() {
  console.log("=== Second Pass: Aggressive Image Matching ===\n");

  // Fetch ginza products
  const allGinza: ShopifyProduct[] = [];
  for (let page = 1; page <= 3; page++) {
    const url = `https://www.ginzatcg.com/products.json?limit=250&page=${page}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.products || data.products.length === 0) break;
    allGinza.push(...data.products);
  }

  const ginzaWithImages = allGinza.filter((p) => p.images.length > 0);
  console.log(`Ginza products with images: ${ginzaWithImages.length}`);

  // Get our products still missing images
  const ourMissing = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { id: true, name: true, slug: true, category: true },
  });
  console.log(`Our products still missing: ${ourMissing.length}\n`);

  let matched = 0;
  const stillUnmatched: Array<{
    name: string;
    category: string;
    bestGinza: string;
    score: number;
  }> = [];

  for (const product of ourMissing) {
    let bestMatch: ShopifyProduct | null = null;
    let bestScore = 0;
    let bestMethod = "";

    for (const gp of ginzaWithImages) {
      // Method 1: Similarity score
      const score = similarity(product.name, gp.title);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = gp;
        bestMethod = "similarity";
      }

      // Method 2: Key word containment
      if (containsAllKeyWords(product.name, gp.title)) {
        const score2 = similarity(product.name, gp.title);
        if (score2 > 0.3 && score2 > bestScore) {
          bestScore = score2;
          bestMatch = gp;
          bestMethod = "keywords";
        }
      }

      // Method 3: Handle/slug partial match
      const ourSlugParts = product.slug.split("-").filter((p) => p.length > 2);
      const ginzaSlugParts = gp.handle.split("-").filter((p) => p.length > 2);
      const slugOverlap =
        ourSlugParts.filter((p) => ginzaSlugParts.includes(p)).length /
        Math.max(ourSlugParts.length, ginzaSlugParts.length);
      if (slugOverlap > 0.5 && slugOverlap > bestScore) {
        bestScore = slugOverlap;
        bestMatch = gp;
        bestMethod = "slug";
      }
    }

    // Lower threshold to 0.35 for this second pass
    if (bestMatch && bestScore >= 0.35) {
      const imageUrls = bestMatch.images
        .sort((a, b) => a.position - b.position)
        .map((img) => img.src);

      await db.product.update({
        where: { id: product.id },
        data: { images: imageUrls },
      });

      matched++;
      console.log(
        `  ✓ [${bestMethod}:${bestScore.toFixed(2)}] "${product.name}" → "${bestMatch.title}"`
      );
    } else {
      stillUnmatched.push({
        name: product.name,
        category: product.category,
        bestGinza: bestMatch?.title || "none",
        score: bestScore,
      });
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Newly matched: ${matched}`);
  console.log(`Still unmatched: ${stillUnmatched.length}`);

  if (stillUnmatched.length > 0) {
    console.log(`\nRemaining unmatched (with best candidate):`);
    for (const u of stillUnmatched) {
      console.log(
        `  [${u.category}] "${u.name}" → best: "${u.bestGinza}" (${u.score.toFixed(2)})`
      );
    }
  }

  // Final stats
  const total = await db.product.count();
  const withImages = await db.product.count({
    where: { NOT: { images: { equals: [] } } },
  });
  console.log(`\nFinal: ${withImages}/${total} products have images (${((withImages / total) * 100).toFixed(1)}%)`);

  await db.$disconnect();
}

main().catch(console.error);
