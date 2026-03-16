"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setCoverPhoto } from "@/lib/actions/album";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  profiles?: { display_name: string };
}

export function PhotoGrid({
  photos,
  albumId,
  coverUrl,
  isAdmin = false,
}: {
  photos: Photo[];
  albumId: string;
  coverUrl?: string | null;
  isAdmin?: boolean;
}) {
  const t = useTranslations("album");
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [settingCover, setSettingCover] = useState<string | null>(null);

  async function handleSetCover(e: React.MouseEvent, photoUrl: string) {
    e.stopPropagation();
    setSettingCover(photoUrl);
    await setCoverPhoto(albumId, photoUrl);
    setSettingCover(null);
    router.refresh();
  }

  if (!photos.length) {
    return <p className="text-sm text-gray-500">{t("noPhotos")}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, i) => {
          const isCover = coverUrl === photo.url;
          const isSettingThis = settingCover === photo.url;

          return (
            <div
              key={photo.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg"
              onClick={() => setSelectedIndex(i)}
            >
              <img
                src={photo.url}
                alt={photo.caption || ""}
                className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Cover badge */}
              {isCover && (
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-yellow-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 fill-yellow-300" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Cover
                </div>
              )}

              {/* Set as cover button (admin, hover) */}
              {isAdmin && !isCover && (
                <button
                  onClick={(e) => handleSetCover(e, photo.url)}
                  disabled={!!settingCover}
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/50 py-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70 disabled:opacity-50"
                >
                  {isSettingThis ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  Set as cover
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
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
              onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex - 1); }}
            >
              &#8249;
            </button>
          )}
          {selectedIndex < photos.length - 1 && (
            <button
              className="absolute right-4 text-4xl text-white hover:text-gray-300"
              onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex + 1); }}
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
