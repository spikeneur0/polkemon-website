import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Heart, Shield } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Polkemon Trading Co — your trusted source for premium trading cards in Ann Arbor, Michigan.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <Image
          src="/logo.png"
          alt={SITE_NAME}
          width={64}
          height={64}
          className="mx-auto h-16 w-16"
        />
        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          About {SITE_NAME}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Premium trading cards and accessories, proudly based in Ann Arbor, Michigan.
        </p>
      </div>

      {/* Story */}
      <div className="mt-12 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          Welcome to {SITE_NAME} — your go-to destination for authentic, high-quality
          trading cards and collectibles. Founded with a passion for the TCG community,
          we&apos;re committed to providing collectors and players with the best products
          at competitive prices.
        </p>
        <p>
          Based in the heart of Ann Arbor, Michigan, we serve customers across the
          United States with fast shipping and exceptional customer service. Whether
          you&apos;re hunting for the latest Pokemon booster box, building your One Piece
          deck, or looking for premium card accessories, we&apos;ve got you covered.
        </p>
        <p>
          We work directly with authorized distributors to ensure every product we
          sell is 100% authentic and factory sealed. Our commitment to quality and
          integrity has earned us the trust of collectors and players nationwide.
        </p>
      </div>

      {/* Values */}
      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">100% Authentic</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            All products sourced from authorized distributors. Factory sealed and
            guaranteed genuine.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Community First</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re collectors ourselves. We understand the community and are
            dedicated to supporting it.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Ann Arbor, MI</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Proudly operated from Ann Arbor, Michigan. Fast shipping across the
            United States.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <h2 className="text-xl font-bold">Ready to start collecting?</h2>
        <Link
          href="/products"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse Products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
