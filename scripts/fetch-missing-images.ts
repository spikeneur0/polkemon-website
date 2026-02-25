/**
 * Fetch missing product images from various online sources
 *
 * Strategy:
 * 1. For each product, try to find a product page on known retailer sites
 * 2. Fetch the page and extract og:image or product image URLs
 * 3. Update the database with found images
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Known image URLs for products we've already found
const KNOWN_IMAGES: Record<string, string[]> = {
  // Pokemon
  "pokmon-team-rocket-tins": [
    "https://static-assets.pokemon.com/content-assets/cms2/img/trading-card-game/series/incrementals/2025/team-rocket-tins/team-rocket-tins-169-us.png",
  ],
  // Yu-Gi-Oh
  "yu-gi-oh-phantom-revenge": [
    "https://www.yugioh-card.com/en/wp-content/uploads/2025/08/PHRE-Foil-550x550-1.png",
  ],
};

// Product-to-URL mapping for fetching
const PRODUCT_URLS: Record<string, string[]> = {
  // Pokemon
  "pokmon-match-battle-pack": [
    "https://www.pokemon.com/us/pokemon-tcg/product-gallery/pokemon-tcg-match-battle",
    "https://www.tcgplayer.com/product/516527/pokemon-mcdonalds-promos-2023-mcdonalds-2023-match-and-battle-pack",
  ],
  "pokmon-sun-moon": [
    "https://www.pokemon.com/us/pokemon-tcg/product-gallery/sun-moon",
    "https://www.tcgplayer.com/product/126048/pokemon-sm-base-set-sun-and-moon-booster-box",
  ],
  "pokmon-starter-set-ex-terastal-stellar-ceruledge": [
    "https://www.plazajapan.com/4521329374512/",
    "https://ichiba-japan.com/en-us/products/starter-set-ex-terastal-stellar-ceruledge-pokemon-card-game",
  ],
  // Yu-Gi-Oh
  "yu-gi-oh-dragons-of-legends-2": [
    "https://www.tcgplayer.com/product/97680/yugioh-dragons-of-legend-2-dragons-of-legend-2-booster-box",
    "https://yugipedia.com/wiki/Dragons_of_Legend_2",
  ],
  // Magic
  "magic-the-gathering-phyrexia-all-will-be-one-set-booster-pack": [
    "https://www.tcgplayer.com/product/451871/magic-phyrexia-all-will-be-one-phyrexia-all-will-be-one-set-booster-pack",
  ],
  // Digimon
  "digimon-x-record-booster-pack-bt09": [
    "https://www.tcgplayer.com/product/277569/digimon-card-game-x-record-x-record-booster-pack",
  ],
  // Weiss Schwarz
  "weiss-schwarz-persona-3-reload-premium-booster": [
    "https://www.tcgplayer.com/product/599677/weiss-schwarz-persona-3-reload-premium-booster-persona-3-reload-premium-booster-box",
  ],
  "weiss-schwarz-dandandan": [
    "https://www.tcgplayer.com/product/657107/weiss-schwarz-dandadan-dandadan-booster-box",
  ],
  // Shadowverse
  "shadowverse-umamusume-crossover-set": [
    "https://en.shadowverse-evolve.com/products/cp01/",
    "https://www.tcgplayer.com/search/shadowverse-evolve/umamusume-pretty-derby-crossover",
  ],
  "shadowverse-banquest-of-dreams": [
    "https://www.tcgplayer.com/product/660622/shadowverse-evolve-bp14-banquet-of-dreams-cs-banquet-of-dreams-and-trial-of-the-omens-booster-box",
  ],
  // Models
  "entry-grade-1144-wing-gundam": [
    "https://www.gundamplanet.com/eg-wing-gundam.html",
  ],
  "hg-mighty-strike-freedom-gundam": [
    "https://www.gundamplanet.com/hg-mighty-strike-freedom-gundam.html",
  ],
  "hg-1144-black-knight": [
    "https://www.gundamplanet.com/hg-black-knight-squad-shi-ve-a.html",
  ],
  "hgb-bearguy-iii-san": [
    "https://www.gundamplanet.com/hgbf-beargguy-iii.html",
  ],
  "rg-1144-akatsuki-gundam-oowashi-unit-mk": [
    "https://www.gundamplanet.com/rg-akatsuki-gundam-oowashi-unit.html",
  ],
  "hguc-1144-baund-doc-zeta": [
    "https://www.gundamplanet.com/hguc-baund-doc.html",
  ],
  "pokmon-model-kit-24-pichu": [
    "https://www.gundamplanet.com/pokemon-24-pichu.html",
  ],
  "chopper-robo-super-2-heavy-armor": [
    "https://www.gundamplanet.com/chopper-robo-super-2-heavy-armor.html",
  ],
  "chopper-robot-3-chopper-submarine": [
    "https://www.gundamplanet.com/chopper-robot-3-chopper-submarine.html",
  ],
  "chopper-robot-2-chopper-wing": [
    "https://www.gundamplanet.com/chopper-robot-2-chopper-wing.html",
  ],
};

async function extractImageFromPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Try og:image first
    const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      const imgUrl = ogMatch[1];
      if (imgUrl.startsWith("http")) return imgUrl;
      // Handle relative URLs
      const base = new URL(url);
      return new URL(imgUrl, base.origin).href;
    }

    // Try twitter:image
    const twitterMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
    if (twitterMatch && twitterMatch[1]) {
      const imgUrl = twitterMatch[1];
      if (imgUrl.startsWith("http")) return imgUrl;
      const base = new URL(url);
      return new URL(imgUrl, base.origin).href;
    }

    // Try product image patterns
    const productImgMatch = html.match(/class=["'][^"']*product[^"']*image[^"']*["'][^>]*src=["']([^"']+)["']/i)
      || html.match(/src=["']([^"']+)["'][^>]*class=["'][^"']*product[^"']*image[^"']*["']/i);
    if (productImgMatch && productImgMatch[1]) {
      const imgUrl = productImgMatch[1];
      if (imgUrl.startsWith("http")) return imgUrl;
      const base = new URL(url);
      return new URL(imgUrl, base.origin).href;
    }

    // For TCGPlayer specifically, try their image pattern
    const tcgMatch = html.match(/(https:\/\/[^"'\s]*tcgplayer[^"'\s]*\.(?:jpg|png|webp))/i);
    if (tcgMatch) return tcgMatch[1];

    // For Shopify stores, look for CDN images
    const shopifyMatch = html.match(/(https:\/\/cdn\.shopify\.com\/[^"'\s]+\.(?:jpg|png|webp))/i);
    if (shopifyMatch) return shopifyMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

async function searchGoogleForImage(query: string): Promise<string | null> {
  // Try DuckDuckGo instant answer API
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&t=polkemon`);
    const data = await res.json();
    if (data.Image && data.Image.startsWith("http")) {
      return data.Image;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function findImageForProduct(
  slug: string,
  name: string,
  category: string
): Promise<string[] | null> {
  // Check known images first
  if (KNOWN_IMAGES[slug]) {
    return KNOWN_IMAGES[slug];
  }

  // Try specific URLs
  if (PRODUCT_URLS[slug]) {
    for (const url of PRODUCT_URLS[slug]) {
      const img = await extractImageFromPage(url);
      if (img) {
        console.log(`  Found via page: ${url}`);
        return [img];
      }
    }
  }

  // Try DuckDuckGo
  const ddgImage = await searchGoogleForImage(`${name} TCG product`);
  if (ddgImage) {
    console.log(`  Found via DuckDuckGo`);
    return [ddgImage];
  }

  return null;
}

async function main() {
  console.log("=== Fetching Missing Product Images ===\n");

  const missing = await db.product.findMany({
    where: { images: { equals: [] } },
    select: { id: true, name: true, slug: true, category: true },
    orderBy: { category: "asc" },
  });

  console.log(`Products missing images: ${missing.length}\n`);

  let found = 0;
  let notFound = 0;
  const results: Array<{ slug: string; name: string; images: string[] }> = [];
  const failures: Array<{ slug: string; name: string; category: string }> = [];

  for (const product of missing) {
    process.stdout.write(`[${product.category}] ${product.name}... `);

    const images = await findImageForProduct(
      product.slug,
      product.name,
      product.category
    );

    if (images && images.length > 0) {
      await db.product.update({
        where: { id: product.id },
        data: { images },
      });
      found++;
      results.push({ slug: product.slug, name: product.name, images });
      console.log(`✓ Found ${images.length} image(s)`);
    } else {
      notFound++;
      failures.push({ slug: product.slug, name: product.name, category: product.category });
      console.log(`✗ Not found`);
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Found images: ${found}`);
  console.log(`Not found: ${notFound}`);

  if (failures.length > 0) {
    console.log(`\nStill missing:`);
    for (const f of failures) {
      console.log(`  [${f.category}] ${f.name} (${f.slug})`);
    }
  }

  if (results.length > 0) {
    console.log(`\nSuccessfully updated:`);
    for (const r of results) {
      console.log(`  ${r.name} → ${r.images[0].substring(0, 80)}...`);
    }
  }

  await db.$disconnect();
}

main().catch(console.error);
