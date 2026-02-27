"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateProduct, deleteProduct } from "@/actions/products";
import { uploadImage, deleteImage } from "@/actions/upload";
import { CATEGORIES } from "@/lib/constants";
import { X, Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import MarketPricingSection from "@/components/admin/market-pricing-section";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  sku: string | null;
  quantity: number;
  tags: string[];
  images: string[];
  isSoldOut: boolean;
  isPublished: boolean;
  // Market pricing fields
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marketPriceActive, setMarketPriceActive] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/products/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setImages(data.images || []);
        setMarketPriceActive(data.marketPriceEnabled || false);
        setLoading(false);
      });
  }, [params.id]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadImage(formData);
      if (result.url) {
        setImages((prev) => [...prev, result.url!]);
      }
    }
    setUploading(false);
  }

  async function handleRemoveImage(url: string) {
    await deleteImage(url);
    setImages((prev) => prev.filter((img) => img !== url));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.set("images", JSON.stringify(images));
    formData.set(
      "isSoldOut",
      (e.currentTarget.querySelector('[name="isSoldOut"]') as HTMLInputElement)
        ?.checked
        ? "true"
        : "false"
    );
    formData.set(
      "isPublished",
      (
        e.currentTarget.querySelector(
          '[name="isPublished"]'
        ) as HTMLInputElement
      )?.checked
        ? "true"
        : "false"
    );

    await updateProduct(product.id, formData);
    router.push("/admin/products");
    setSaving(false);
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteProduct(product.id);
    router.push("/admin/products");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  // Show manual price (fallback) when market pricing is active
  const displayPrice = marketPriceActive && product.manualPrice != null
    ? product.manualPrice
    : product.price;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium">Product Name</label>
          <input
            name="name"
            required
            defaultValue={product.name}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            defaultValue={product.description}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={marketPriceActive ? "opacity-50" : ""}>
            <label className="block text-sm font-medium">
              Price ($)
              {marketPriceActive && (
                <span className="ml-2 text-xs font-normal text-green-600">
                  Managed by market sync
                </span>
              )}
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              disabled={marketPriceActive}
              defaultValue={(displayPrice / 100).toFixed(2)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Compare at Price ($)
            </label>
            <input
              name="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                product.compareAtPrice
                  ? (product.compareAtPrice / 100).toFixed(2)
                  : ""
              }
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Market Pricing Section */}
        <MarketPricingSection
          productId={product.id}
          initialData={{
            marketPriceEnabled: product.marketPriceEnabled,
            marketPrice: product.marketPrice,
            marketPriceLastUpdated: product.marketPriceLastUpdated,
            marketPriceMarkup: Number(product.marketPriceMarkup) || 0,
            marketPriceCondition: product.marketPriceCondition || "Near Mint",
            marketPricePrinting: product.marketPricePrinting || "Holofoil",
            justTcgId: product.justTcgId,
            tcgplayerId: product.tcgplayerId,
            linkedCardName: product.linkedCardName,
            manualPrice: product.manualPrice,
          }}
          onMarketPriceToggle={(enabled) => setMarketPriceActive(enabled)}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="category"
              required
              defaultValue={product.category}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">SKU</label>
            <input
              name="sku"
              defaultValue={product.sku || ""}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Quantity</label>
            <input
              name="quantity"
              type="number"
              min="0"
              defaultValue={product.quantity}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Tags (comma separated)
            </label>
            <input
              name="tags"
              defaultValue={product.tags.join(", ")}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-8">
          <label className="flex items-center gap-2">
            <input
              name="isSoldOut"
              type="checkbox"
              defaultChecked={product.isSoldOut}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm font-medium">Sold Out</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              name="isPublished"
              type="checkbox"
              defaultChecked={product.isPublished}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm font-medium">Published</span>
          </label>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium">Images</label>
          <div className="mt-2">
            {images.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative h-24 w-24">
                    <Image
                      src={url}
                      alt={`Upload ${i + 1}`}
                      fill
                      className="rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Click to upload images"}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
