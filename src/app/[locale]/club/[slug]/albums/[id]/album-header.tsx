"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAlbum } from "@/lib/actions/album";

export function AlbumHeader({
  albumId,
  title,
  description,
  isAdmin,
}: {
  albumId: string;
  title: string;
  description: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    const result = await updateAlbum(albumId, formData);
    if (result.error) {
      setError(result.error);
      setSaving(false);
    } else {
      setEditing(false);
      setSaving(false);
      router.refresh();
    }
  }

  if (editing) {
    return (
      <form action={handleSubmit} className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          name="title"
          defaultValue={title}
          required
          autoFocus
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xl font-bold text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <textarea
          name="description"
          defaultValue={description ?? ""}
          rows={2}
          placeholder="Description (optional)"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group relative">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {isAdmin && (
        <button
          onClick={() => setEditing(true)}
          className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-green-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      )}
    </div>
  );
}
