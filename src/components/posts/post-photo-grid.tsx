"use client";

import { useState } from "react";

export type GridPhoto = { id: string; url: string };

export function PostPhotoGrid({ photos }: { photos: GridPhoto[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const count = photos.length;
  if (!count) return null;

  const shown = photos.slice(0, 5);
  const overflow = count - 5;

  function gridClass() {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count >= 3) return "grid-cols-3";
    return "grid-cols-2";
  }

  function cellClass(i: number) {
    // 3 photos: first spans 2 rows
    if (count === 3 && i === 0) return "row-span-2";
    // 1 photo: wider aspect
    if (count === 1) return "";
    return "";
  }

  function aspectClass(i: number) {
    if (count === 1) return "aspect-video";
    if (count === 3 && i === 0) return "aspect-auto h-full min-h-[12rem]";
    return "aspect-square";
  }

  return (
    <>
      <div className={`grid gap-0.5 overflow-hidden ${gridClass()}`}>
        {shown.map((photo, i) => {
          const isLast = i === 4 && overflow > 0;
          return (
            <div
              key={photo.id}
              className={`relative cursor-zoom-in overflow-hidden bg-gray-100 ${cellClass(i)} ${aspectClass(i)}`}
              onClick={() => setLightbox(i)}
            >
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
              {isLast && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
                  <span className="text-3xl font-bold text-white drop-shadow">+{overflow + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Counter */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-sm text-white/60">
            {lightbox + 1} / {photos.length}
          </span>
          {/* Prev */}
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {/* Next */}
          {lightbox < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <img
            src={photos[lightbox].url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
