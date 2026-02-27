"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/actions/products";
import { uploadImage, deleteImage } from "@/actions/upload";
import { CATEGORIES } from "@/lib/constants";
import { X, Upload } from "lucide-react";
import Image from "next/image";

export default function NewProductPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.set("images", JSON.stringify(images));

    const result = await createProduct(formData);
    if (result.success) {
      router.push("/admin/products");
    }
    setSaving(false);
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Add Product</h1>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium">Product Name</label>
          <input
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Pokemon Scarlet & Violet Booster Box"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            required
            rows={4}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Describe the product..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Price ($)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="129.99"
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
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="149.99"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="category"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select category</option>
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
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="PKM-SV-BB-001"
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
              defaultValue="0"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Tags (comma separated)
            </label>
            <input
              name="tags"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="pokemon, booster-box, scarlet-violet"
            />
          </div>
        </div>

        {/* Image Upload */}
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
            {saving ? "Creating..." : "Create Product"}
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
