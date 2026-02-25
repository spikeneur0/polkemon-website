"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShoppingCart, Menu, Search, X, ChevronDown } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { CATEGORIES, NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CartSheet } from "@/components/cart/cart-sheet";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt={SITE_NAME}
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="hidden text-lg font-semibold tracking-tight sm:inline-block">
              {SITE_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {/* Shop dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <Link
                href="/products"
                className="flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                Shop
                <ChevronDown className="h-3.5 w-3.5" />
              </Link>
              {shopOpen && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-56 rounded-md border border-border bg-background p-2 shadow-lg">
                    <Link
                      href="/products"
                      className="block rounded-sm px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      All Products
                    </Link>
                    <div className="my-1 h-px bg-border" />
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/collections/${cat.slug}`}
                        className="block rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {NAV_LINKS.filter((l) => l.href !== "/products").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="rounded-md p-2 transition-colors hover:bg-accent"
              aria-label="Search products"
            >
              <Search className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-md p-2 transition-colors hover:bg-accent"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-md p-2 transition-colors hover:bg-accent md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="border-t border-border md:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent"
              >
                Shop All
              </Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/collections/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 pl-6 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
                >
                  {cat.name}
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent"
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </header>
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
