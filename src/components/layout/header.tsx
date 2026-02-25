"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Menu,
  Search,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { CATEGORIES, NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";
import { CartSheet } from "@/components/cart/cart-sheet";

// ---------- Mega menu category groups ----------
const MEGA_MENU_GROUPS = [
  {
    label: "Trading Card Games",
    slugs: [
      "pokemon",
      "one-piece",
      "yu-gi-oh",
      "magic-the-gathering",
      "weiss-schwarz",
      "lorcana",
      "digimon",
      "other-tcgs",
    ],
  },
  {
    label: "Singles",
    slugs: ["pokemon-singles-jp", "pokemon-singles-eng", "digimon-singles"],
  },
  {
    label: "Collectibles",
    slugs: [
      "blind-boxes",
      "figures",
      "plush",
      "models",
      "keychains",
      "clothing",
      "jewelry-pins",
      "stickers",
    ],
  },
  {
    label: "More",
    slugs: ["supplies", "food-drink", "other", "gift-cards"],
  },
] as const;

function getCategoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

// ---------- Search result type ----------
interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
  isSoldOut: boolean;
}

// ---------- Search Modal ----------
function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Autofocus when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function navigate(slug: string) {
    onClose();
    router.push(`/products/${slug}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-xl animate-in fade-in slide-in-from-top-4 duration-200 mx-4">
        <div className="rounded-lg border border-border bg-background shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter" && results.length > 0) {
                  navigate(results[0].slug);
                }
              }}
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-block">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && query.trim() && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!loading && query.trim() && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </div>
            )}
            {results.map((product) => (
              <button
                key={product.id}
                onClick={() => navigate(product.slug)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                {product.images[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-md border border-border object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getCategoryName(product.category)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {product.isSoldOut ? (
                    <span className="text-xs font-medium text-destructive">
                      Sold Out
                    </span>
                  ) : (
                    <span className="text-sm font-semibold">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
            Press <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Mobile collapsible group ----------
function MobileNavGroup({
  label,
  slugs,
  onNavigate,
}: {
  label: string;
  slugs: readonly string[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-foreground/90 transition-colors hover:bg-accent"
      >
        {label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="ml-3 space-y-0.5">
          {slugs.map((slug) => (
            <Link
              key={slug}
              href={`/collections/${slug}`}
              onClick={onNavigate}
              className="block truncate rounded-md px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
            >
              {getCategoryName(slug)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Header ----------
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState("");
  const itemCount = useCartStore((s) => s.itemCount());
  const router = useRouter();

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Listen for "open-cart" custom event from AddToCartButton
  useEffect(() => {
    function handleOpenCart() {
      setCartOpen(true);
    }
    window.addEventListener("open-cart", handleOpenCart);
    return () => window.removeEventListener("open-cart", handleOpenCart);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

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
            {/* Shop mega-menu */}
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
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    shopOpen && "rotate-180"
                  )}
                />
              </Link>

              {/* Mega menu dropdown */}
              <div
                className={cn(
                  "absolute left-1/2 top-full pt-3 -translate-x-1/2",
                  "pointer-events-none opacity-0 transition-opacity duration-200",
                  shopOpen && "pointer-events-auto opacity-100"
                )}
              >
                <div className="w-[800px] rounded-lg border border-border bg-background p-6 shadow-xl">
                  {/* All Products link */}
                  <Link
                    href="/products"
                    className="mb-4 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-accent"
                  >
                    All Products
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>

                  {/* Columns */}
                  <div className="grid grid-cols-4 gap-6">
                    {MEGA_MENU_GROUPS.map((group) => (
                      <div key={group.label}>
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.label}
                        </h3>
                        <div className="space-y-0.5">
                          {group.slugs.map((slug) => (
                            <Link
                              key={slug}
                              href={`/collections/${slug}`}
                              className="block rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                            >
                              {getCategoryName(slug)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-1.5 rounded-md p-2 transition-colors hover:bg-accent"
              aria-label="Search products (Ctrl+K)"
            >
              <Search className="h-5 w-5" />
              <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline-block">
                {typeof navigator !== "undefined" &&
                /Mac|iPod|iPhone|iPad/.test(navigator.platform)
                  ? "\u2318K"
                  : "Ctrl K"}
              </kbd>
            </button>
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
            <nav className="mx-auto max-w-7xl px-4 py-4">
              {/* Mobile search */}
              <div className="mb-3 flex items-center gap-2 rounded-md border border-input px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && mobileSearch.trim()) {
                      closeMobile();
                      setSearchOpen(true);
                    }
                  }}
                  onFocus={() => {
                    closeMobile();
                    setSearchOpen(true);
                  }}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              {/* Shop All */}
              <Link
                href="/products"
                onClick={closeMobile}
                className="block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent"
              >
                Shop All
              </Link>

              {/* Grouped categories */}
              <div className="mt-1 space-y-0.5">
                {MEGA_MENU_GROUPS.map((group) => (
                  <MobileNavGroup
                    key={group.label}
                    label={group.label}
                    slugs={group.slugs}
                    onNavigate={closeMobile}
                  />
                ))}
              </div>

              <div className="my-2 h-px bg-border" />

              <Link
                href="/about"
                onClick={closeMobile}
                className="block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={closeMobile}
                className="block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent"
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </header>

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
