/**
 * Targeted image search using Shopify store search APIs
 * Searches for specific products by keyword on stores we know work
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface ShopifyImage {
  src: string;
  position: number;
}

interface ShopifyProduct {
  title: string;
  handle: string;
  images: ShopifyImage[];
}

// Search configuration: product slug -> { stores to search, search queries }
const SEARCH_CONFIG: Record<string, { stores: string[]; queries: string[] }> = {
  // TCG Products
  "weiss-schwarz-dandandan": {
    stores: ["https://www.gamersguildaz.com", "https://flipsidegaming.com", "https://www.tanukigamesatx.com", "https://tbcgames.com", "https://galactictoys.com"],
    queries: ["dandadan weiss", "dandadan booster"],
  },
  "digimon-x-record-booster-pack-bt09": {
    stores: ["https://www.gamersguildaz.com", "https://flipsidegaming.com", "https://tbcgames.com", "https://galactictoys.com"],
    queries: ["digimon x record", "x record bt09"],
  },
  "yu-gi-oh-dragons-of-legends-2": {
    stores: ["https://www.gamersguildaz.com", "https://tbcgames.com", "https://galactictoys.com", "https://totalcards.net"],
    queries: ["dragons of legend 2", "dragons legend yugioh"],
  },
  "pokmon-sun-moon": {
    stores: ["https://thepokecourt.com", "https://tbcgames.com", "https://galactictoys.com"],
    queries: ["sun moon booster", "sun & moon"],
  },
  "pokmon-match-battle-pack": {
    stores: ["https://thepokecourt.com", "https://tbcgames.com", "https://galactictoys.com"],
    queries: ["match battle", "match battle pack"],
  },
  "shadowverse-banquest-of-dreams": {
    stores: ["https://www.gamersguildaz.com", "https://galactictoys.com", "https://totalcards.net"],
    queries: ["banquet of dreams", "shadowverse banquet"],
  },
  // Pokemon singles
  "purrloin-master-ball-pattern-sv11w": {
    stores: ["https://ichiba-japan.com", "https://toysonejapan.com"],
    queries: ["purrloin master ball", "purrloin sv11w"],
  },
  "archeops-master-ball-pattern-sv11w": {
    stores: ["https://ichiba-japan.com", "https://toysonejapan.com"],
    queries: ["archeops master ball", "archeops sv11w"],
  },
  // Models
  "hg-1144-black-knight": {
    stores: ["https://usagundamstore.com", "https://galactictoys.com"],
    queries: ["black knight gundam hg", "black knight squad"],
  },
  "hguc-1144-baund-doc-zeta": {
    stores: ["https://usagundamstore.com", "https://galactictoys.com"],
    queries: ["baund doc", "baund-doc hguc"],
  },
  "rg-1144-akatsuki-gundam-oowashi-unit-mk": {
    stores: ["https://usagundamstore.com", "https://galactictoys.com"],
    queries: ["akatsuki gundam rg", "akatsuki oowashi"],
  },
  "chopper-robo-super-2-heavy-armor": {
    stores: ["https://usagundamstore.com", "https://galactictoys.com", "https://ichiba-japan.com"],
    queries: ["chopper robo heavy armor", "chopper robo super"],
  },
  "chopper-robot-2-chopper-wing": {
    stores: ["https://usagundamstore.com", "https://galactictoys.com", "https://ichiba-japan.com"],
    queries: ["chopper robo wing", "chopper wing"],
  },
  "chopper-robot-3-chopper-submarine": {
    stores: ["https://usagundamstore.com", "https://galactictoys.com", "https://ichiba-japan.com"],
    queries: ["chopper submarine", "chopper robot submarine"],
  },
  // Japanese snacks/drinks
  "coke": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["coca cola", "coke"],
  },
  "diet-coke": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["diet coke", "coca cola diet"],
  },
  "mountain-dew": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["mountain dew"],
  },
  "sakeru-gummy": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["sakeru gummy"],
  },
  "hokkaido-gyunyu-caramel": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["hokkaido caramel", "gyunyu caramel"],
  },
  "ucc-matcha-latte": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["ucc matcha", "matcha latte"],
  },
  "asahi-wonda-black-coffee": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["wonda coffee", "asahi coffee"],
  },
  "puchao-fruit-soda": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["puchao", "puchao fruit"],
  },
  "barnums-animal-crackers": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["animal crackers"],
  },
  "dotz-pretzels": {
    stores: ["https://japancandystore.com", "https://sugoimart.com"],
    queries: ["pretzels"],
  },
  // Anime merch
  "ichiban-kuji-spy-x-family": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com", "https://toysonejapan.com"],
    queries: ["ichiban kuji spy family"],
  },
  "made-in-abyss-fluffy-plushie-faputa": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com", "https://galactictoys.com"],
    queries: ["faputa plush", "made in abyss faputa"],
  },
  "pokmon-eevee-keychain": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com", "https://toysonejapan.com"],
    queries: ["eevee keychain"],
  },
  "pokmon-kanto-gym-bracelet": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com"],
    queries: ["kanto gym bracelet", "pokemon bracelet"],
  },
  "devil-fruit-bracelet": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com"],
    queries: ["devil fruit bracelet"],
  },
  "sanrio-chopsticks": {
    stores: ["https://ichiba-japan.com", "https://sugoimart.com"],
    queries: ["sanrio chopsticks"],
  },
  "frieren-case-keychain": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com", "https://toysonejapan.com"],
    queries: ["frieren keychain"],
  },
  "sanrio-characters-afternoon-tea-3-keychain": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com"],
    queries: ["sanrio afternoon tea keychain"],
  },
  "sanrio-okurumi-mascot-japanese-pattern-keychains": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com"],
    queries: ["sanrio okurumi", "okurumi mascot"],
  },
  "sanrio-popcorn-triple-charm-keychains": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com"],
    queries: ["sanrio popcorn charm", "sanrio popcorn keychain"],
  },
  "dodowo-chubby-chick-series-vol-5": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com", "https://galactictoys.com"],
    queries: ["dodowo chubby chick", "chubby chick vol 5"],
  },
  "hololive-counter-set": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com"],
    queries: ["hololive counter"],
  },
  "kmc-mini-character-sleeve-guard": {
    stores: ["https://galactictoys.com", "https://usagundamstore.com"],
    queries: ["kmc character sleeve", "kmc mini sleeve guard"],
  },
  "broccoli-card-sleeve-protector-clear": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com"],
    queries: ["broccoli sleeve protector", "broccoli card sleeve"],
  },
  "broccoli-sleeve-protector-emboss-clear-small": {
    stores: ["https://ichiba-japan.com", "https://shumistore.com"],
    queries: ["broccoli sleeve emboss", "broccoli emboss clear"],
  },
};

async function searchShopifyStore(storeUrl: string, query: string): Promise<ShopifyProduct[]> {
  try {
    // Try the search suggest API first
    const suggestUrl = `${storeUrl}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(suggestUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.resources?.results?.products?.length > 0) {
        // The suggest API returns limited data, so fetch full product details
        const products: ShopifyProduct[] = [];
        for (const p of data.resources.results.products) {
          if (p.image) {
            products.push({
              title: p.title,
              handle: p.handle,
              images: [{ src: p.image, position: 1 }],
            });
          }
        }
        return products;
      }
    }
  } catch (e) {
    // Try alternative search
  }

  // Try search.json endpoint
  try {
    const searchUrl = `${storeUrl}/search.json?q=${encodeURIComponent(query)}&type=product`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      // Extract product handles from search results
      const handles = [...text.matchAll(/\/products\/([a-z0-9-]+)/g)].map(m => m[1]);
      const uniqueHandles = [...new Set(handles)].slice(0, 3);

      const products: ShopifyProduct[] = [];
      for (const handle of uniqueHandles) {
        try {
          const productUrl = `${storeUrl}/products/${handle}.json`;
          const pRes = await fetch(productUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData.product?.images?.length > 0) {
              products.push(pData.product);
            }
          }
        } catch (e) {
          // ignore
        }
      }
      return products;
    }
  } catch (e) {
    // ignore
  }

  return [];
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(" ").filter(w => w.length > 1));
  const wordsB = new Set(normalize(b).split(" ").filter(w => w.length > 1));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

async function main() {
  console.log("=== Targeted Image Search ===\n");

  const missing = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { id: true, name: true, slug: true, category: true },
  });
  console.log(`Products still missing: ${missing.length}\n`);

  let found = 0;
  let notFound = 0;

  for (const product of missing) {
    const config = SEARCH_CONFIG[product.slug];
    if (!config) {
      console.log(`  [${product.category}] ${product.name} - no search config`);
      notFound++;
      continue;
    }

    process.stdout.write(`  [${product.category}] ${product.name}... `);
    let foundImage = false;

    for (const store of config.stores) {
      if (foundImage) break;
      for (const query of config.queries) {
        if (foundImage) break;
        const results = await searchShopifyStore(store, query);

        // Find best matching result
        let bestMatch: ShopifyProduct | null = null;
        let bestScore = 0;

        for (const r of results) {
          const score = similarity(product.name, r.title);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = r;
          }
        }

        // Accept matches with 0.3+ score since we already searched specifically
        if (bestMatch && bestScore >= 0.3) {
          const imageUrls = bestMatch.images
            .sort((a, b) => a.position - b.position)
            .map(img => img.src);

          await db.product.update({
            where: { id: product.id },
            data: { images: imageUrls },
          });

          found++;
          foundImage = true;
          console.log(`✓ [${bestScore.toFixed(2)}] → "${bestMatch.title}" (${store})`);
        }
      }
    }

    if (!foundImage) {
      console.log("✗");
      notFound++;
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Found: ${found}`);
  console.log(`Not found: ${notFound}`);

  const total = await db.product.count();
  const withImages = await db.product.count({
    where: { NOT: { images: { equals: [] } } },
  });
  console.log(`\nFinal: ${withImages}/${total} products have images (${((withImages / total) * 100).toFixed(1)}%)`);

  await db.$disconnect();
}

main().catch(console.error);
