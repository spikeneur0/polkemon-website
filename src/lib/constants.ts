export const SITE_NAME = "Polkemon Trading Co";
export const SITE_DESCRIPTION =
  "Premium trading cards and accessories from Ann Arbor, Michigan. Pokemon, One Piece, Yu-Gi-Oh, Magic: The Gathering, and more.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const CATEGORIES = [
  // TCG Categories
  { slug: "pokemon", name: "Pokemon TCG" },
  { slug: "one-piece", name: "One Piece TCG" },
  { slug: "yu-gi-oh", name: "Yu-Gi-Oh" },
  { slug: "magic-the-gathering", name: "Magic: The Gathering" },
  { slug: "weiss-schwarz", name: "Weiss Schwarz" },
  { slug: "lorcana", name: "Lorcana" },
  { slug: "digimon", name: "Digimon" },
  { slug: "other-tcgs", name: "Other TCGs" },
  // Singles
  { slug: "pokemon-singles-jp", name: "Pokemon Singles (JP)" },
  { slug: "pokemon-singles-eng", name: "Pokemon Singles (ENG)" },
  { slug: "digimon-singles", name: "Digimon Singles" },
  // Supplies & Accessories
  { slug: "supplies", name: "TCG Supplies" },
  // Collectibles & Merch
  { slug: "blind-boxes", name: "Blind Boxes" },
  { slug: "figures", name: "Figures" },
  { slug: "plush", name: "Plush" },
  { slug: "models", name: "Models" },
  { slug: "keychains", name: "Keychains" },
  { slug: "clothing", name: "Clothing" },
  { slug: "jewelry-pins", name: "Jewelry & Pins" },
  { slug: "stickers", name: "Stickers" },
  { slug: "food-drink", name: "Food & Drink" },
  { slug: "other", name: "Other" },
  { slug: "gift-cards", name: "Gift Cards" },
] as const;

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
