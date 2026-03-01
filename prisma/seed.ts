import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Map scraped category names to our slug system
const CATEGORY_MAP: Record<string, string> = {
  "Pokemon TCG": "pokemon",
  "One Piece TCG": "one-piece",
  "Magic: The Gathering": "magic-the-gathering",
  "Yu-Gi-Oh": "yu-gi-oh",
  Lorcana: "lorcana",
  "Weiss Schwarz": "weiss-schwarz",
  Digimon: "digimon",
  "TCG Supplies": "supplies",
  "Blind Boxes": "blind-boxes",
  Figures: "figures",
  Plush: "plush",
  Stickers: "stickers",
  Keychains: "keychains",
  Clothing: "clothing",
  "Jewelry & Pins": "jewelry-pins",
  "Food & Drink": "food-drink",
  Models: "models",
  "Pokemon Singles (JP)": "pokemon-singles-jp",
  "Pokemon Singles (ENG)": "pokemon-singles-eng",
  "Digimon Singles": "digimon-singles",
  "Other TCGs": "other-tcgs",
  Other: "other",
  "Gift Cards": "gift-cards",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 120); // Keep slugs reasonable length
}

function parsePrice(priceStr: string): number {
  // Handle "From $X.XX" format - take the base price
  const cleaned = priceStr.replace(/^From\s+/i, "").replace("$", "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100); // Convert to cents
}

function generateDescription(product: {
  name: string;
  category: string;
}): string {
  const cat = product.category;

  if (cat === "Pokemon TCG" || cat === "One Piece TCG" || cat === "Lorcana")
    return `${product.name}. Sealed and authentic product from the ${cat} line. Perfect for collectors and competitive players alike.`;

  if (cat === "Magic: The Gathering")
    return `${product.name}. Sealed MTG product, perfect for building decks and expanding your collection.`;

  if (cat === "Yu-Gi-Oh")
    return `${product.name}. Official Yu-Gi-Oh! product. Great for duelists and collectors.`;

  if (cat === "Weiss Schwarz")
    return `${product.name}. Official Weiss Schwarz product featuring beloved anime characters.`;

  if (cat === "Digimon" || cat === "Digimon Singles")
    return `${product.name}. Digimon Card Game product for players and collectors.`;

  if (cat === "TCG Supplies")
    return `${product.name}. Quality TCG accessories to protect and display your card collection.`;

  if (cat === "Blind Boxes")
    return `${product.name}. Collectible blind box figure. Each box contains a random figure from the series.`;

  if (cat === "Figures")
    return `${product.name}. Detailed collectible figure for anime and game fans.`;

  if (cat === "Plush")
    return `${product.name}. Soft and cuddly plush toy, perfect as a gift or collectible.`;

  if (cat === "Models")
    return `${product.name}. Model kit for building and display. A must-have for hobbyists.`;

  if (cat === "Keychains")
    return `${product.name}. Stylish keychain accessory featuring popular characters.`;

  if (cat === "Clothing")
    return `${product.name}. Premium apparel for fans and collectors.`;

  if (cat === "Jewelry & Pins")
    return `${product.name}. Collectible pin or jewelry piece for fans.`;

  if (cat === "Stickers")
    return `${product.name}. Decorative sticker for personalizing your gear.`;

  if (cat === "Food & Drink")
    return `${product.name}. Japanese import snack or drink. Enjoy unique flavors from Japan!`;

  if (
    cat === "Pokemon Singles (JP)" ||
    cat === "Pokemon Singles (ENG)"
  )
    return `${product.name}. Individual Pokemon trading card. Card condition: Near Mint.`;

  if (cat === "Other TCGs")
    return `${product.name}. Trading card game product from a popular series.`;

  return `${product.name}. Available at Polkemon Trading Co.`;
}

// Determine which products to feature (pick top products with images from popular categories)
const FEATURED_SLUGS = [
  "pokemon-m2-mega-inferno-jpn",
  "pokemon-m1s-mega-symphonia-jpn",
  "one-piece-eb03-jpn",
  "weiss-schwarz-freiren-beyond-journeys-end",
  "yu-gi-oh-alliance-insight---booster-pack-1st-edition",
  "lorcana-whispers-in-the-well",
  "mtg-bloomburrow-play-booster-pack",
  "the-monsters-wacky-mart-tumblers",
];

async function main() {
  console.log("Starting seed...");

  // 1. Create admin user
  // IMPORTANT: Change this password immediately after first login
  const defaultPassword =
    "Ptc-" +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2);
  const hashedPassword = await hash(defaultPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@polkemontradingco.com" },
    update: {},
    create: {
      email: "admin@polkemontradingco.com",
      hashedPassword,
      name: "Admin",
    },
  });
  console.log("Admin user created/verified.");
  console.log(
    `⚠️  Default admin password: ${defaultPassword} — change this immediately in production`
  );

  // 2. Read ginza-products.json
  const jsonPath = path.join(__dirname, "..", "ginza-products.json");
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(rawData);
  const products: Array<{
    name: string;
    price: string;
    category: string;
    sold_out: boolean;
    image: string | null;
    variants?: string[];
  }> = data.products;

  console.log(`Found ${products.length} products to seed.`);

  // 3. Delete existing products (clean slate)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  console.log("Cleared existing products and orders.");

  // 4. Seed all products
  const slugTracker = new Map<string, number>();
  let seededCount = 0;
  let featuredOrder = 1;

  for (const p of products) {
    // Skip products with $0 price
    const priceCents = parsePrice(p.price);
    if (priceCents === 0) continue;

    // Generate unique slug
    let baseSlug = slugify(p.name);
    if (!baseSlug) baseSlug = `product-${seededCount}`;

    const count = slugTracker.get(baseSlug) || 0;
    slugTracker.set(baseSlug, count + 1);
    const slug = count > 0 ? `${baseSlug}-${count}` : baseSlug;

    // Map category
    const category = CATEGORY_MAP[p.category] || "other";

    // Build images array
    const images: string[] = [];
    if (p.image) {
      images.push(p.image);
    }

    // Check if this should be featured
    const isFeatured = FEATURED_SLUGS.includes(slug);
    const currentFeaturedOrder = isFeatured ? featuredOrder++ : undefined;

    // Determine quantity (sold out = 0, otherwise random stock)
    const quantity = p.sold_out ? 0 : Math.floor(Math.random() * 30) + 1;

    // Build tags from category and name keywords
    const tags: string[] = [category];
    if (p.name.toLowerCase().includes("booster")) tags.push("booster");
    if (p.name.toLowerCase().includes("box")) tags.push("box");
    if (p.name.toLowerCase().includes("pack")) tags.push("pack");
    if (p.name.toLowerCase().includes("deck")) tags.push("deck");
    if (p.name.toLowerCase().includes("sleeves")) tags.push("sleeves");
    if (p.name.toLowerCase().includes("dragon shield"))
      tags.push("dragon-shield");
    if (p.name.toLowerCase().includes("nendoroid")) tags.push("nendoroid");
    if (p.name.toLowerCase().includes("plush")) tags.push("plush");
    if (p.name.toLowerCase().includes("blind box")) tags.push("blind-box");

    try {
      await prisma.product.create({
        data: {
          name: p.name,
          slug,
          description: generateDescription(p),
          price: priceCents,
          category,
          images,
          isSoldOut: p.sold_out,
          isFeatured,
          featuredOrder: currentFeaturedOrder,
          quantity,
          tags,
          isPublished: true,
        },
      });
      seededCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to seed "${p.name}" (slug: ${slug}): ${msg}`);
    }
  }

  console.log(`\nSeed completed! ${seededCount} products created.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
