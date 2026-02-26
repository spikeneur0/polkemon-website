"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  enableMarketPricing,
  disableMarketPricing,
  updateMarketPricingFields,
  linkCard,
  unlinkCard,
} from "@/actions/market-pricing";
import { formatPrice } from "@/lib/utils";
import {
  Search,
  Link2,
  Unlink,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Check,
} from "lucide-react";

interface CardSearchResult {
  id: string;
  name: string;
  tcgplayerId: string | null;
  game: string;
  set: string;
  rarity?: string;
  variants: Array<{
    condition: string;
    printing: string;
    price: number | null;
  }>;
}

interface MarketPricingData {
  marketPriceEnabled: boolean;
  marketPrice: number | null;
  marketPriceLastUpdated: string | null;
  marketPriceMarkup: number;
  marketPriceCondition: string;
  marketPricePrinting: string;
  justTcgId: string | null;
  tcgplayerId: string | null;
  linkedCardName: string | null;
  manualPrice: number | null;
}

interface Props {
  productId: string;
  initialData: MarketPricingData;
  onMarketPriceToggle: (enabled: boolean) => void;
}

const CONDITIONS = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];
const PRINTINGS = [
  "Holofoil",
  "Normal",
  "Reverse Holofoil",
  "1st Edition Holofoil",
  "Unlimited Holofoil",
];

export default function MarketPricingSection({
  productId,
  initialData,
  onMarketPriceToggle,
}: Props) {
  const [enabled, setEnabled] = useState(initialData.marketPriceEnabled);
  const [condition, setCondition] = useState(initialData.marketPriceCondition);
  const [printing, setPrinting] = useState(initialData.marketPricePrinting);
  const [markup, setMarkup] = useState(initialData.marketPriceMarkup);
  const [marketPrice, setMarketPrice] = useState(initialData.marketPrice);
  const [lastUpdated, setLastUpdated] = useState(
    initialData.marketPriceLastUpdated
  );
  const [linkedCardName, setLinkedCardName] = useState(
    initialData.linkedCardName
  );
  const [justTcgId, setJustTcgId] = useState(initialData.justTcgId);
  const [tcgplayerId, setTcgplayerId] = useState(initialData.tcgplayerId);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Action state
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Close search results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Debounced card search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/admin/market-prices/search?q=${encodeURIComponent(query.trim())}`
        );
        const json = await res.json();
        setSearchResults(json.data || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  // Link a card from search results
  const handleLinkCard = async (card: CardSearchResult) => {
    setSaving(true);
    setShowResults(false);
    setSearchQuery("");

    await linkCard(
      productId,
      card.id,
      card.tcgplayerId,
      `${card.name} — ${card.set} (${card.game})`
    );

    setJustTcgId(card.id);
    setTcgplayerId(card.tcgplayerId);
    setLinkedCardName(`${card.name} — ${card.set} (${card.game})`);

    // Check if this card has a price for the current condition/printing
    const variant = card.variants?.find(
      (v) => v.condition === condition && v.printing === printing
    );
    if (variant?.price != null) {
      setMarketPrice(Math.round(variant.price * 100));
    }

    setSaving(false);
    showMessage("success", "Card linked successfully");
  };

  // Unlink card
  const handleUnlinkCard = async () => {
    if (!confirm("Unlink this card? Market pricing will be disabled.")) return;
    setSaving(true);

    await unlinkCard(productId);

    setJustTcgId(null);
    setTcgplayerId(null);
    setLinkedCardName(null);
    setMarketPrice(null);
    setEnabled(false);
    onMarketPriceToggle(false);

    setSaving(false);
    showMessage("success", "Card unlinked");
  };

  // Toggle market pricing on/off
  const handleToggle = async () => {
    if (!enabled && !tcgplayerId) {
      showMessage("error", "Link a card first before enabling market pricing");
      return;
    }

    if (!enabled && marketPrice == null) {
      showMessage(
        "error",
        "No market price available. Try refreshing the price first."
      );
      return;
    }

    setSaving(true);

    if (!enabled) {
      // Enable
      const result = await enableMarketPricing(productId, {
        justTcgId: justTcgId!,
        tcgplayerId,
        condition,
        printing,
        markup,
        marketPriceCents: marketPrice!,
        linkedCardName: linkedCardName || "",
      });

      if (result.success) {
        setEnabled(true);
        onMarketPriceToggle(true);
        showMessage("success", "Market pricing enabled");
      } else {
        showMessage("error", result.error || "Failed to enable");
      }
    } else {
      // Disable
      const result = await disableMarketPricing(productId);
      if (result.success) {
        setEnabled(false);
        onMarketPriceToggle(false);
        showMessage("success", "Market pricing disabled — manual price restored");
      }
    }

    setSaving(false);
  };

  // Refresh price for single product
  const handleRefresh = async () => {
    if (!tcgplayerId) return;
    setRefreshing(true);

    try {
      const res = await fetch(
        `/api/admin/market-prices/sync/${productId}`,
        { method: "POST" }
      );
      const json = await res.json();

      if (json.success && json.priceCents) {
        setMarketPrice(json.priceCents);
        setLastUpdated(new Date().toISOString());
        showMessage("success", `Price updated: ${formatPrice(json.priceCents)}`);
      } else {
        showMessage("error", json.error || "Failed to fetch price");
      }
    } catch {
      showMessage("error", "Network error refreshing price");
    }

    setRefreshing(false);
  };

  // Update condition/printing/markup
  const handleFieldChange = async (
    field: "condition" | "printing" | "markup",
    value: string | number
  ) => {
    if (field === "condition") setCondition(value as string);
    if (field === "printing") setPrinting(value as string);
    if (field === "markup") setMarkup(value as number);

    if (justTcgId) {
      await updateMarketPricingFields(productId, {
        [field === "condition"
          ? "condition"
          : field === "printing"
            ? "printing"
            : "markup"]: value,
      });
    }
  };

  const effectivePrice =
    marketPrice != null
      ? Math.round(marketPrice * (1 + markup / 100))
      : null;

  const timeAgo = lastUpdated ? getTimeAgo(new Date(lastUpdated)) : null;

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Market Pricing</h3>
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-green-600" : "bg-muted"
          } ${saving ? "opacity-50" : ""}`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-2 flex items-center gap-2 rounded px-3 py-1.5 text-xs ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {message.text}
        </div>
      )}

      {/* Card Search & Link */}
      <div className="mt-3">
        {linkedCardName ? (
          <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-800">
                {linkedCardName}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUnlinkCard}
              disabled={saving}
              className="rounded p-1 text-green-600 hover:bg-green-100"
              title="Unlink card"
            >
              <Unlink className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for a card to link..."
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
                {searchResults.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleLinkCard(card)}
                    className="flex w-full flex-col gap-0.5 border-b border-border px-3 py-2 text-left transition-colors last:border-0 hover:bg-accent"
                  >
                    <span className="text-sm font-medium">{card.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {card.set} &middot; {card.game}
                      {card.rarity ? ` · ${card.rarity}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && !searching && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card p-3 text-center text-xs text-muted-foreground shadow-lg">
                No cards found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Condition / Printing / Markup */}
      {(linkedCardName || justTcgId) && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => handleFieldChange("condition", e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Printing
            </label>
            <select
              value={printing}
              onChange={(e) => handleFieldChange("printing", e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PRINTINGS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Markup (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="999"
              value={markup}
              onChange={(e) =>
                handleFieldChange("markup", parseFloat(e.target.value) || 0)
              }
              className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Price Display */}
      {(linkedCardName || justTcgId) && (
        <div className="mt-3 rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {marketPrice != null ? (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-muted-foreground">
                      Market:
                    </span>
                    <span className="text-sm font-medium">
                      {formatPrice(marketPrice)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs text-muted-foreground">
                      Sell ({markup > 0 ? `+${markup}%` : "no markup"}):
                    </span>
                    <span className="text-sm font-bold text-green-700">
                      {effectivePrice != null
                        ? formatPrice(effectivePrice)
                        : "—"}
                    </span>
                  </div>
                  {timeAgo && (
                    <p className="text-[10px] text-muted-foreground">
                      Updated {timeAgo}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  No price available — click Refresh
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || !tcgplayerId}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      )}

      {/* Active indicator */}
      {enabled && (
        <p className="mt-2 text-[10px] font-medium text-green-600">
          Price is being set by market sync. Manual price field is disabled.
        </p>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
