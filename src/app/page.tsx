import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import { NewsletterSignup } from "@/components/home/newsletter-signup";

export const dynamic = "force-dynamic";

const HOMEPAGE_CATEGORIES = [
  { slug: "pokemon", name: "Pokemon TCG", icon: "⚡", color: "#dc6b2f" },
  { slug: "one-piece", name: "One Piece TCG", icon: "🏴‍☠️", color: "#b91c1c" },
  { slug: "yu-gi-oh", name: "Yu-Gi-Oh", icon: "🃏", color: "#7c3aed" },
  {
    slug: "magic-the-gathering",
    name: "Magic: The Gathering",
    icon: "🔮",
    color: "#1d4ed8",
  },
  { slug: "weiss-schwarz", name: "Weiss Schwarz", icon: "🎌", color: "#0d9488" },
  { slug: "lorcana", name: "Lorcana", icon: "✨", color: "#4f46e5" },
  { slug: "blind-boxes", name: "Blind Boxes", icon: "🎁", color: "#c026d3" },
  { slug: "figures", name: "Figures & More", icon: "🎭", color: "#475569" },
];

export default async function HomePage() {
  const featuredProducts = await db.product.findMany({
    where: { isFeatured: true, isPublished: true },
    orderBy: { featuredOrder: "asc" },
    take: 8,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      images: true,
      isSoldOut: true,
    },
  });

  const newArrivals = await db.product.findMany({
    where: {
      isPublished: true,
      isSoldOut: false,
      NOT: { images: { equals: [] } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: true,
      isSoldOut: true,
    },
  });

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-4 top-0 h-72 w-72 rounded-full bg-orange-500 blur-3xl" />
          <div className="absolute -right-4 bottom-0 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500 blur-3xl" />
        </div>
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <Image
            src="/logo.png"
            alt={SITE_NAME}
            width={96}
            height={96}
            className="h-24 w-24 drop-shadow-2xl"
            priority
          />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Premium Trading Cards
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            Your trusted source for Pokemon, One Piece, Yu-Gi-Oh, Magic: The
            Gathering, and more. Based in Ann Arbor, Michigan.
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-md bg-white px-8 py-3 text-sm font-medium text-slate-900 shadow-lg transition-all hover:bg-slate-100 hover:shadow-xl"
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-8 py-3 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              About Us
            </Link>
          </div>
          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              100% Authentic
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              Fast Shipping
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Secure Checkout
            </span>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Featured Products
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl text-muted-foreground/30">
                        🃏
                      </span>
                    </div>
                  )}
                  {product.isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="text-sm font-bold uppercase tracking-[0.15em] text-white">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-medium line-clamp-2">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {formatPrice(product.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Collection Tiles */}
      <section className="bg-accent/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Shop by Category
            </h2>
            <Link
              href="/products"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {HOMEPAGE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                className="group relative flex h-40 items-end overflow-hidden rounded-lg p-4 transition-shadow hover:shadow-lg sm:h-48"
                style={{ backgroundColor: cat.color }}
              >
                <div className="relative z-10">
                  <span className="text-2xl">{cat.icon}</span>
                  <h3 className="mt-1 text-base font-semibold text-white sm:text-lg">
                    {cat.name}
                  </h3>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-white/80 transition-colors group-hover:text-white">
                    Shop now
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">New Arrivals</h2>
            <Link
              href="/products?sort=newest"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {newArrivals.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl text-muted-foreground/30">
                        🃏
                      </span>
                    </div>
                  )}
                  {product.isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="text-sm font-bold uppercase tracking-[0.15em] text-white">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-medium line-clamp-2">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {formatPrice(product.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="border-t border-border bg-accent/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Stay in the Loop
            </h2>
            <p className="mt-2 text-muted-foreground">
              Be the first to know about new product drops, restocks, and
              exclusive deals.
            </p>
            <NewsletterSignup />
          </div>
        </div>
      </section>
    </div>
  );
}
