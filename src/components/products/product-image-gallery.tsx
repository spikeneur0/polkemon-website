"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  isSoldOut: boolean;
}

export function ProductImageGallery({
  images,
  productName,
  isSoldOut,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, closeLightbox]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const currentImage = images[selectedIndex];

  return (
    <>
      <div className="space-y-4">
        {/* Main image */}
        <div
          className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted"
          onClick={() => currentImage && setLightboxOpen(true)}
        >
          {currentImage ? (
            <>
              <Image
                src={currentImage}
                alt={productName}
                fill
                priority
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Click to zoom hint */}
              <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/40 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="text-xs font-medium text-white">
                  Click to zoom
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl text-muted-foreground/30">
                &#x1F0CF;
              </span>
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-lg font-bold uppercase tracking-[0.15em] text-white">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail images */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`relative aspect-square overflow-hidden rounded-md bg-muted ring-offset-background transition-all ${
                  i === selectedIndex
                    ? "ring-2 ring-foreground ring-offset-2"
                    : "hover:opacity-80"
                }`}
              >
                <Image
                  src={img}
                  alt={`${productName} ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox overlay */}
      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage}
              alt={productName}
              width={1200}
              height={1200}
              className="max-h-[90vh] w-auto rounded-lg object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
