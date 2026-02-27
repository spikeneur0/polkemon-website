"use client";

import { useState, useEffect } from "react";
import {
  getSettings,
  updateSettings,
  bulkEnableMarketPricing,
  bulkDisableMarketPricing,
  getSyncLogs,
} from "@/actions/settings";
import {
  Settings,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Check,
  BarChart3,
  Clock,
  Zap,
} from "lucide-react";

interface SiteSettingsData {
  marketPriceMasterEnabled: boolean;
  marketPriceDefaultMarkup: number;
  marketPriceDefaultCondition: string;
  marketPriceSyncFrequency: string;
  marketPriceShowBadge: boolean;
}

interface SyncLog {
  id: string;
  startedAt: string;
  completedAt: string | null;
  totalProducts: number;
  successCount: number;
  errorCount: number;
  apiCallsUsed: number;
  triggeredBy: string;
}

interface UsageData {
  usage: {
    dailyCalls: number;
    monthlyCalls: number;
    dailyLimit: number;
    monthlyLimit: number;
    lastApiCallsRemaining: number | null;
  };
  enabledProductCount: number;
  estimatedBulkCalls: number;
  apiKeyConfigured: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [settingsData, logs] = await Promise.all([
        getSettings(),
        getSyncLogs(50),
      ]);

      setSettings({
        marketPriceMasterEnabled: settingsData.marketPriceMasterEnabled,
        marketPriceDefaultMarkup: settingsData.marketPriceDefaultMarkup,
        marketPriceDefaultCondition: settingsData.marketPriceDefaultCondition,
        marketPriceSyncFrequency: settingsData.marketPriceSyncFrequency,
        marketPriceShowBadge: settingsData.marketPriceShowBadge,
      });

      setSyncLogs(
        logs.map((l) => ({
          ...l,
          startedAt: l.startedAt.toISOString(),
          completedAt: l.completedAt?.toISOString() || null,
        }))
      );

      // Fetch usage data
      const usageRes = await fetch("/api/admin/market-prices/usage");
      if (usageRes.ok) {
        setUsage(await usageRes.json());
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    const result = await updateSettings(settings);
    if (result.success) {
      showMessage("success", "Settings saved");
    }
    setSaving(false);
  }

  async function handleSyncAll() {
    if (
      !confirm(
        `This will sync prices for all enabled products. Estimated API calls: ${usage?.estimatedBulkCalls || "unknown"}. Continue?`
      )
    )
      return;

    setSyncing(true);
    try {
      const res = await fetch("/api/admin/market-prices/sync", {
        method: "POST",
      });
      const result = await res.json();

      if (result.success) {
        showMessage(
          "success",
          `Synced ${result.successCount}/${result.totalProducts} products (${result.errorCount} errors)`
        );
      } else {
        showMessage("error", result.errors?.[0]?.error || "Sync failed");
      }

      // Refresh data
      await loadData();
    } catch {
      showMessage("error", "Network error during sync");
    }
    setSyncing(false);
  }

  async function handleBulkEnable() {
    if (!confirm("Enable market pricing for all products that have a linked card?"))
      return;
    const result = await bulkEnableMarketPricing();
    showMessage("success", `Enabled for ${result.count} products`);
    await loadData();
  }

  async function handleBulkDisable() {
    if (!confirm("Disable market pricing for ALL products? Manual prices will be restored."))
      return;
    const result = await bulkDisableMarketPricing();
    showMessage("success", `Disabled for ${result.count} products`);
    await loadData();
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const hasApiKey = true; // We check env var on server side; show warning if usage fetch failed

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="mt-6 max-w-3xl space-y-8">
        {/* Master Toggle */}
        <section className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Market Price Syncing</h2>
                <p className="text-sm text-muted-foreground">
                  Master toggle — when off, no products will sync regardless of
                  per-item settings
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings((s) =>
                  s
                    ? {
                        ...s,
                        marketPriceMasterEnabled: !s.marketPriceMasterEnabled,
                      }
                    : s
                )
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                settings.marketPriceMasterEnabled ? "bg-green-600" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.marketPriceMasterEnabled
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {usage && !usage.apiKeyConfigured && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Set JUSTTCG_API_KEY in your environment variables to use market pricing
            </div>
          )}
        </section>

        {/* Default Settings */}
        <section className="rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold">Default Settings</h2>
          <p className="text-sm text-muted-foreground">
            Applied when market pricing is first enabled on a product
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Default Markup (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="999"
                value={settings.marketPriceDefaultMarkup}
                onChange={(e) =>
                  setSettings((s) =>
                    s
                      ? {
                          ...s,
                          marketPriceDefaultMarkup:
                            parseFloat(e.target.value) || 0,
                        }
                      : s
                  )
                }
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Default Condition
              </label>
              <select
                value={settings.marketPriceDefaultCondition}
                onChange={(e) =>
                  setSettings((s) =>
                    s
                      ? {
                          ...s,
                          marketPriceDefaultCondition: e.target.value,
                        }
                      : s
                  )
                }
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Near Mint">Near Mint</option>
                <option value="Lightly Played">Lightly Played</option>
                <option value="Moderately Played">Moderately Played</option>
                <option value="Heavily Played">Heavily Played</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Auto-Sync Frequency
              </label>
              <select
                value={settings.marketPriceSyncFrequency}
                onChange={(e) =>
                  setSettings((s) =>
                    s
                      ? { ...s, marketPriceSyncFrequency: e.target.value }
                      : s
                  )
                }
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="6h">Every 6 hours</option>
                <option value="12h">Every 12 hours</option>
                <option value="24h">Every 24 hours</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Free tier: 100 calls/day, 1000/month. Factor in your catalog
                size.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">
                Display Options
              </label>
              <label className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.marketPriceShowBadge}
                  onChange={(e) =>
                    setSettings((s) =>
                      s
                        ? { ...s, marketPriceShowBadge: e.target.checked }
                        : s
                    )
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">
                  Show &quot;Live Priced&quot; badge on storefront
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </section>

        {/* API Usage */}
        {usage && (
          <section className="rounded-lg border border-border p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">API Usage</h2>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-md border border-border p-4 text-center">
                <p className="text-2xl font-bold">{usage.usage.dailyCalls}</p>
                <p className="text-xs text-muted-foreground">
                  Today / {usage.usage.dailyLimit}
                </p>
                {usage.usage.dailyCalls > usage.usage.dailyLimit * 0.8 && (
                  <p className="mt-1 text-xs text-amber-600">Near limit</p>
                )}
              </div>
              <div className="rounded-md border border-border p-4 text-center">
                <p className="text-2xl font-bold">
                  {usage.usage.monthlyCalls}
                </p>
                <p className="text-xs text-muted-foreground">
                  This month / {usage.usage.monthlyLimit}
                </p>
                {usage.usage.monthlyCalls >
                  usage.usage.monthlyLimit - 50 && (
                  <p className="mt-1 text-xs text-red-600">
                    Below 50 remaining — consider upgrading
                  </p>
                )}
              </div>
              <div className="rounded-md border border-border p-4 text-center">
                <p className="text-2xl font-bold">
                  {usage.enabledProductCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Products syncing
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Bulk Actions */}
        <section className="rounded-lg border border-border p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Bulk Actions</h2>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Syncing..." : "Update All Prices Now"}
            </button>

            <button
              onClick={handleBulkEnable}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Enable All Linked
            </button>

            <button
              onClick={handleBulkDisable}
              className="inline-flex items-center gap-2 rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white"
            >
              Disable All
            </button>
          </div>

          {usage && (
            <p className="mt-2 text-xs text-muted-foreground">
              &quot;Update All&quot; will use approximately{" "}
              {usage.estimatedBulkCalls} API call
              {usage.estimatedBulkCalls !== 1 ? "s" : ""}
            </p>
          )}
        </section>

        {/* Sync Log */}
        <section className="rounded-lg border border-border p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Sync Log</h2>
          </div>

          {syncLogs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No sync events yet
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Time
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Products
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Success
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      Errors
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      API Calls
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {syncLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-2 pr-4 text-xs">
                        {new Date(log.startedAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            log.triggeredBy === "cron"
                              ? "bg-blue-50 text-blue-700"
                              : log.triggeredBy === "manual"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {log.triggeredBy}
                        </span>
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {log.totalProducts}
                      </td>
                      <td className="py-2 pr-4 tabular-nums text-green-600">
                        {log.successCount}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {log.errorCount > 0 ? (
                          <span className="text-red-600">
                            {log.errorCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2 tabular-nums">{log.apiCallsUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
