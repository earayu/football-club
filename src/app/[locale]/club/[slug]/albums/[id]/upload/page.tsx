"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { uploadPhotos } from "@/lib/actions/photo";
import { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

export default function UploadPage() {
  const t = useTranslations("album");
  const params = useParams();
  const router = useRouter();
  const albumId = params.id as string;
  const slug = params.slug as string;
  const locale = params.locale as string;

  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }

  async function handleUpload() {
    if (!fileRef.current?.files?.length) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    Array.from(fileRef.current.files).forEach((file) => {
      formData.append("photos", file);
    });

    const result = await uploadPhotos(albumId, formData);
    if (result.error) {
      setError(result.error);
      setIsUploading(false);
    } else {
      router.push(`/${locale}/club/${slug}/albums/${albumId}`);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900">{t("uploadPhotos")}</h2>

      <div className="mt-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-green-500"
          onClick={() => fileRef.current?.click()}
        >
          <span className="text-3xl">📷</span>
          <p className="mt-2 text-sm text-gray-600">{t("selectFiles")}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {previews.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="aspect-square rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {previews.length > 0 && (
          <Button
            className="mt-4 w-full"
            onClick={handleUpload}
            isLoading={isUploading}
          >
            {isUploading ? t("uploading") : t("uploadPhotos")}
          </Button>
        )}
      </div>
    </div>
  );
}
