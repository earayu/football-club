"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAlbum, deleteAlbum } from "@/lib/actions/album";

type Album = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
  photoCount: number;
};

export function AlbumManager({
  clubId,
  clubSlug,
  albums,
}: {
  clubId: string;
  clubSlug: string;
  albums: Album[];
}) {
  const t = useTranslations("album");
  const tm = useTranslations("manage");
  const tc = useTranslations("common");
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setIsCreating(true);
    setError(null);
    const result = await createAlbum(clubId, formData);
    if (result.error) {
      setError(result.error);
      setIsCreating(false);
    } else {
      setShowForm(false);
      setIsCreating(false);
      router.refresh();
    }
  }

  async function handleDelete(albumId: string) {
    if (!confirm("Delete this album and all its photos?")) return;
    setDeletingId(albumId);
    const result = await deleteAlbum(albumId, clubSlug);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{tm("albumManagement")}</h2>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm"
        >
          {showForm ? tc("cancel") : `+ ${t("createAlbum")}`}
        </Button>
      </div>

      {showForm && (
        <form
          action={handleCreate}
          className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4"
        >
          <h3 className="font-medium text-gray-800">{t("createAlbum")}</h3>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <Input
            id="title"
            name="title"
            label={t("albumTitle")}
            placeholder="Match Day vs City FC"
            required
          />
          <div className="space-y-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              {t("description")}
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowForm(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" isLoading={isCreating}>
              {t("createAlbum")}
            </Button>
          </div>
        </form>
      )}

      {!showForm && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {albums.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          <p className="text-4xl">📷</p>
          <p className="mt-3 text-sm">{t("noAlbums")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <div key={album.id} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              {/* Delete button — top-right corner */}
              <button
                onClick={() => handleDelete(album.id)}
                disabled={deletingId === album.id}
                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500 disabled:opacity-30"
                title={tc("delete")}
              >
                {deletingId === album.id ? (
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>

              {/* Card is fully clickable → album detail */}
              <Link href={`/club/${clubSlug}/albums/${album.id}`} className="block">
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-gray-50 text-5xl text-gray-300">
                    📷
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{album.title}</h3>
                  {album.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{album.description}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
