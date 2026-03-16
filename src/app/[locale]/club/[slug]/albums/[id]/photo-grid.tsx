"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  profiles?: { display_name: string };
}

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const t = useTranslations("album");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!photos.length) {
    return <p className="text-sm text-gray-500">{t("noPhotos")}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="cursor-pointer overflow-hidden rounded-lg"
            onClick={() => setSelectedIndex(i)}
          >
            <img
              src={photo.url}
              alt={photo.caption || ""}
              className="aspect-square w-full object-cover transition-transform hover:scale-105"
            />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            className="absolute right-4 top-4 text-3xl text-white hover:text-gray-300"
            onClick={() => setSelectedIndex(null)}
          >
            &times;
          </button>
          {selectedIndex > 0 && (
            <button
              className="absolute left-4 text-4xl text-white hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex - 1);
              }}
            >
              &#8249;
            </button>
          )}
          {selectedIndex < photos.length - 1 && (
            <button
              className="absolute right-4 text-4xl text-white hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex + 1);
              }}
            >
              &#8250;
            </button>
          )}
          <img
            src={photos[selectedIndex].url}
            alt={photos[selectedIndex].caption || ""}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
