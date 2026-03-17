"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPost,
  appendTextBlock,
  appendPhotosBlock,
  appendVideoBlock,
} from "@/lib/actions/posts";

type BlockType = "text" | "photos" | "video";

const BLOCK_TABS: { type: BlockType; icon: string; label: string }[] = [
  { type: "text", icon: "✍️", label: "文字" },
  { type: "photos", icon: "📷", label: "照片" },
  { type: "video", icon: "🎬", label: "视频" },
];

export function NewPostForm({
  clubId,
  userAvatarUrl,
  userInitial,
}: {
  clubId: string;
  userAvatarUrl?: string | null;
  userInitial: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockType, setBlockType] = useState<BlockType>("text");
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const [videoPreviewOk, setVideoPreviewOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setOpen(false);
    setPreviews([]);
    setError(null);
    setVideoPreviewOk(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const title = (fd.get("title") as string)?.trim();
    const location = (fd.get("location") as string)?.trim();
    const eventDate = fd.get("eventDate") as string;

    const postResult = await createPost(clubId, { title, location, eventDate });
    if (postResult.error || !postResult.post) {
      setError(postResult.error ?? "Failed to create post");
      setSaving(false);
      return;
    }

    const postId = (postResult.post as any).id;

    if (blockType === "text") {
      const body = (fd.get("body") as string)?.trim();
      if (body) {
        const r = await appendTextBlock(postId, body);
        if (r.error) { setError(r.error); setSaving(false); return; }
      }
    } else if (blockType === "video") {
      const url = (fd.get("videoUrl") as string)?.trim();
      const caption = (fd.get("videoCaption") as string)?.trim();
      if (url) {
        const r = await appendVideoBlock(postId, url, caption);
        if (r.error) { setError(r.error); setSaving(false); return; }
      }
    } else if (blockType === "photos") {
      const photoFd = new FormData();
      const files = fileRef.current?.files;
      if (files) {
        for (const f of Array.from(files)) photoFd.append("photos", f);
      }
      if (photoFd.has("photos")) {
        const r = await appendPhotosBlock(postId, photoFd);
        if (r.error) { setError(r.error); setSaving(false); return; }
      }
    }

    setSaving(false);
    handleClose();
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-green-300 hover:shadow-md"
      >
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-9 w-9 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-sm font-bold text-white">
            {userInitial}
          </div>
        )}
        <span className="text-sm text-gray-400">写一条手记，记录球队故事...</span>
        <span className="ml-auto flex items-center gap-2 text-xs text-gray-300">
          <span>📷</span><span>🎬</span>
        </span>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-9 w-9 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-sm font-bold text-white">
            {userInitial}
          </div>
        )}
        <p className="font-semibold text-gray-800">新建手记</p>
        <button onClick={handleClose} className="ml-auto text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            <svg className="h-4 w-4 shrink-0 fill-red-500" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Meta fields */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input name="title" placeholder="标题（可选，如：主场 3:0 胜利）" />
          <Input name="location" placeholder="📍 地点（可选）" />
        </div>
        <Input
          name="eventDate"
          type="datetime-local"
          label="活动时间"
          defaultValue={new Date().toISOString().slice(0, 16)}
        />

        {/* Block type selector */}
        <div className="flex gap-1.5 rounded-xl bg-gray-50 p-1">
          {BLOCK_TABS.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => { setBlockType(tab.type); setPreviews([]); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                blockType === tab.type
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Text block */}
        {blockType === "text" && (
          <textarea
            name="body"
            rows={5}
            placeholder="写下今天发生的故事..."
            required
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20"
          />
        )}

        {/* Photos block */}
        {blockType === "photos" && (
          <div className="space-y-3">
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-10 transition hover:border-green-400 hover:bg-green-50/30"
              onClick={() => fileRef.current?.click()}
            >
              <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-500">点击上传照片</p>
              <p className="text-xs text-gray-400">支持多张，JPG / PNG</p>
              <input
                ref={fileRef}
                name="photos"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setPreviews(files.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
                }}
              />
            </div>
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5">
                {previews.map((p, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                ))}
                <p className="col-span-4 text-xs text-gray-400">{previews.length} 张已选</p>
              </div>
            )}
          </div>
        )}

        {/* Video block */}
        {blockType === "video" && (
          <div className="space-y-3">
            <Input
              name="videoUrl"
              placeholder="粘贴 YouTube 或 Bilibili 链接"
              required
              onChange={(e) => {
                const v = e.target.value;
                setVideoPreviewOk(v.includes("youtube") || v.includes("youtu.be") || v.includes("bilibili"));
              }}
            />
            <Input name="videoCaption" placeholder="视频说明（可选）" />
            {videoPreviewOk && (
              <p className="flex items-center gap-1.5 text-xs text-green-600">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                已识别视频链接
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose}>
            取消
          </Button>
          <Button type="submit" isLoading={saving}>
            发布手记
          </Button>
        </div>
      </form>
    </div>
  );
}
