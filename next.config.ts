import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "www.ginzatcg.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "www.yugioh-card.com",
      },
      {
        protocol: "https",
        hostname: "cdn11.bigcommerce.com",
      },
      {
        protocol: "https",
        hostname: "www.gundamplanet.com",
      },
      {
        protocol: "https",
        hostname: "en.shadowverse-evolve.com",
      },
      {
        protocol: "https",
        hostname: "static-assets.pokemon.com",
      },
    ],
  },
};

export default nextConfig;
