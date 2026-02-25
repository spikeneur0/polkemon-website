import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@polkemontradingco.com" },
    update: {},
    create: {
      email: "admin@polkemontradingco.com",
      hashedPassword,
      name: "Admin",
    },
  });

  // Create sample products
  const products = [
    {
      name: "Pokemon Scarlet & Violet Booster Box",
      slug: "pokemon-sv-booster-box",
      description:
        "Sealed Pokemon Scarlet & Violet base set booster box containing 36 packs. Each pack contains 10 cards.",
      price: 12999,
      category: "pokemon",
      images: [],
      quantity: 25,
      tags: ["pokemon", "booster-box", "scarlet-violet"],
      isFeatured: true,
      featuredOrder: 1,
    },
    {
      name: "Pokemon 151 Elite Trainer Box",
      slug: "pokemon-151-etb",
      description:
        "Pokemon 151 Elite Trainer Box featuring the original 151 Pokemon. Includes 9 booster packs and accessories.",
      price: 4999,
      category: "pokemon",
      images: [],
      quantity: 15,
      tags: ["pokemon", "etb", "151"],
      isFeatured: true,
      featuredOrder: 2,
    },
    {
      name: "One Piece TCG OP-09 Booster Box",
      slug: "one-piece-op09-booster-box",
      description:
        "One Piece Trading Card Game OP-09 booster box. 24 packs per box with 12 cards per pack.",
      price: 10999,
      category: "one-piece",
      images: [],
      quantity: 20,
      tags: ["one-piece", "booster-box", "op-09"],
      isFeatured: true,
      featuredOrder: 3,
    },
    {
      name: "Yu-Gi-Oh! Age of Overlord Booster Box",
      slug: "yugioh-age-of-overlord",
      description:
        "Yu-Gi-Oh! Age of Overlord booster box. 24 packs with 9 cards each. Features powerful new archetypes.",
      price: 7999,
      category: "yu-gi-oh",
      images: [],
      quantity: 30,
      tags: ["yu-gi-oh", "booster-box", "age-of-overlord"],
    },
    {
      name: "MTG Murders at Karlov Manor Draft Box",
      slug: "mtg-karlov-manor-draft",
      description:
        "Magic: The Gathering Murders at Karlov Manor draft booster box. 36 packs for the ultimate draft experience.",
      price: 11999,
      category: "magic-the-gathering",
      images: [],
      quantity: 12,
      tags: ["mtg", "magic", "booster-box", "karlov-manor"],
      isFeatured: true,
      featuredOrder: 4,
    },
    {
      name: "Ultra Pro Card Sleeves (100 count)",
      slug: "ultra-pro-sleeves-100",
      description:
        "Ultra Pro standard size card sleeves. Clear, durable protection for your trading cards. 100 count pack.",
      price: 799,
      category: "supplies",
      images: [],
      quantity: 100,
      tags: ["sleeves", "supplies", "ultra-pro"],
    },
    {
      name: "Lorcana The First Chapter Booster Box",
      slug: "lorcana-first-chapter-booster",
      description:
        "Disney Lorcana The First Chapter booster box. 24 packs of 12 cards each.",
      price: 14999,
      category: "lorcana",
      images: [],
      quantity: 0,
      isSoldOut: true,
      tags: ["lorcana", "disney", "booster-box", "first-chapter"],
    },
    {
      name: "Weiss Schwarz Hololive Booster Box",
      slug: "weiss-schwarz-hololive",
      description:
        "Weiss Schwarz Hololive Production booster box. Features your favorite VTubers in card form.",
      price: 6999,
      category: "weiss-schwarz",
      images: [],
      quantity: 8,
      tags: ["weiss-schwarz", "hololive", "booster-box"],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  console.log("Seed completed successfully");
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
