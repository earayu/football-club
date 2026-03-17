"use client";

import { useState, useRef, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import {
  createPost,
  appendTextBlock,
  appendPhotosBlock,
  appendVideoBlock,
} from "@/lib/actions/posts";

// ─── Types ────────────────────────────────────────────────────────────────────

type TextBlock = { id: string; type: "text"; content: string };
type PhotoBlock = { id: string; type: "photos"; files: File[]; previews: string[] };
type VideoBlock = { id: string; type: "video"; url: string; caption: string; valid: boolean };
type Block = TextBlock | PhotoBlock | VideoBlock;

function makeId() {
  return Math.random().toString(36).slice(2);
}

// ─── Video URL parser ─────────────────────────────────────────────────────────

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const bili = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bili) return `https://player.bilibili.com/player.html?bvid=${bili[1]}&autoplay=0`;
  return null;
}

// ─── Individual block editors ─────────────────────────────────────────────────

function TextBlockEditor({
  block,
  onChange,
  onRemove,
  autoFocus,
}: {
  block: TextBlock;
  onChange: (content: string) => void;
  onRemove: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="group relative">
      <textarea
        autoFocus={autoFocus}
        value={block.content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="写下这一刻的故事..."
        rows={3}
        className="w-full resize-none rounded-xl border-0 bg-transparent px-0 py-1 text-[15px] leading-relaxed text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-0"
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
      />
      <BlockRemoveButton onRemove={onRemove} />
    </div>
  );
}

function PhotoBlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: PhotoBlock;
  onChange: (files: File[], previews: string[]) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newFiles = [...block.files, ...arr];
    const newPreviews = [...block.previews, ...arr.map((f) => URL.createObjectURL(f))];
    onChange(newFiles, newPreviews);
  }

  function removePhoto(i: number) {
    const newFiles = block.files.filter((_, idx) => idx !== i);
    const newPreviews = block.previews.filter((_, idx) => idx !== i);
    onChange(newFiles, newPreviews);
  }

  return (
    <div className="group relative space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed py-6 transition ${
          dragging ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-gray-50/50"
        }`}
      >
        <svg className={`h-8 w-8 transition ${dragging ? "text-green-500" : "text-gray-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="text-sm font-medium text-gray-400">
          {block.files.length > 0 ? "继续添加照片" : "拖拽或点击上传照片"}
        </p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Preview grid */}
      {block.previews.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {block.previews.map((url, i) => (
            <div key={i} className="group/photo relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover/photo:opacity-100 hover:bg-red-500"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <BlockRemoveButton onRemove={onRemove} />
    </div>
  );
}

function VideoBlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: VideoBlock;
  onChange: (url: string, caption: string) => void;
  onRemove: () => void;
}) {
  const embedUrl = block.url ? getVideoEmbed(block.url) : null;

  return (
    <div className="group relative space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5">
        <svg className={`h-4 w-4 shrink-0 transition ${block.valid ? "text-green-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        <input
          type="url"
          value={block.url}
          onChange={(e) => onChange(e.target.value, block.caption)}
          placeholder="粘贴 YouTube 或 Bilibili 链接..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
        />
        {block.valid && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            已识别
          </span>
        )}
      </div>

      {embedUrl && (
        <div className="overflow-hidden rounded-xl bg-black">
          <div className="relative aspect-video w-full">
            <iframe src={embedUrl} className="absolute inset-0 h-full w-full" allowFullScreen />
          </div>
        </div>
      )}

      {block.valid && (
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onChange(block.url, e.target.value)}
          placeholder="视频说明（可选）"
          className="w-full bg-transparent text-xs text-gray-500 placeholder:text-gray-300 focus:outline-none"
        />
      )}

      <BlockRemoveButton onRemove={onRemove} />
    </div>
  );
}

function BlockRemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-500 group-hover:flex"
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ─── Add block menu ───────────────────────────────────────────────────────────

function AddBlockMenu({ onAdd }: { onAdd: (type: Block["type"]) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
      >
        <svg className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-45" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        添加内容
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
          {[
            { type: "text" as const, icon: "✍️", label: "文字" },
            { type: "photos" as const, icon: "🖼️", label: "照片" },
            { type: "video" as const, icon: "🎬", label: "视频" },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => { onAdd(item.type); setOpen(false); }}
              className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main BlockEditor ─────────────────────────────────────────────────────────

export function BlockEditor({
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

  // Meta
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 16));

  // Blocks
  const [blocks, setBlocks] = useState<Block[]>([
    { id: makeId(), type: "text", content: "" },
  ]);

  function addBlock(type: Block["type"]) {
    let block: Block;
    if (type === "text") block = { id: makeId(), type: "text", content: "" };
    else if (type === "photos") block = { id: makeId(), type: "photos", files: [], previews: [] };
    else block = { id: makeId(), type: "video", url: "", caption: "", valid: false };
    setBlocks((prev) => [...prev, block]);
  }

  function updateBlock(id: string, updates: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } as Block : b));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.length === 1 ? prev : prev.filter((b) => b.id !== id));
  }

  function handleClose() {
    setOpen(false);
    setTitle("");
    setLocation("");
    setEventDate(new Date().toISOString().slice(0, 16));
    setBlocks([{ id: makeId(), type: "text", content: "" }]);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const postResult = await createPost(clubId, {
      title: title.trim() || undefined,
      location: location.trim() || undefined,
      eventDate,
    }) as any;

    if (postResult.error || !postResult.post) {
      setError(postResult.error ?? "Failed to create post");
      setSaving(false);
      return;
    }

    const postId = postResult.post.id;

    for (const block of blocks) {
      if (block.type === "text" && block.content.trim()) {
        await appendTextBlock(postId, block.content.trim());
      } else if (block.type === "photos" && block.files.length > 0) {
        const fd = new FormData();
        block.files.forEach((f) => fd.append("photos", f));
        await appendPhotosBlock(postId, fd);
      } else if (block.type === "video" && block.url.trim()) {
        await appendVideoBlock(postId, block.url.trim(), block.caption || undefined);
      }
    }

    setSaving(false);
    handleClose();
    router.refresh();
  }

  // ── Collapsed state ──────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-green-300 hover:shadow-md"
      >
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-9 w-9 rounded-full object-cover shrink-0" alt="" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-sm font-bold text-white">
            {userInitial}
          </div>
        )}
        <span className="text-sm text-gray-400">写一条手记，记录球队故事...</span>
        <div className="ml-auto flex items-center gap-2 text-gray-300">
          <span className="text-base">🖼️</span>
          <span className="text-base">🎬</span>
          <span className="text-base">✍️</span>
        </div>
      </button>
    );
  }

  // ── Expanded editor ──────────────────────────────────────────────────────────
  return (
    <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-xl">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3.5">
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-8 w-8 rounded-full object-cover shrink-0" alt="" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-xs font-bold text-white">
            {userInitial}
          </div>
        )}
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-800 placeholder:text-gray-300 focus:outline-none"
          />
          <div className="flex shrink-0 items-center gap-3 text-xs text-gray-400">
            <label className="flex items-center gap-1 cursor-pointer hover:text-gray-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="地点"
                className="w-20 bg-transparent placeholder:text-gray-300 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-transparent focus:outline-none"
              />
            </label>
          </div>
        </div>
        <button onClick={handleClose} className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Block canvas */}
      <form onSubmit={handleSubmit}>
        <div className="min-h-[160px] space-y-3 px-5 pt-4 pb-2">
          {error && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>
          )}

          {blocks.map((block, i) => (
            <div key={block.id}>
              {block.type === "text" && (
                <TextBlockEditor
                  block={block}
                  autoFocus={i === 0}
                  onChange={(content) => updateBlock(block.id, { content })}
                  onRemove={() => removeBlock(block.id)}
                />
              )}
              {block.type === "photos" && (
                <PhotoBlockEditor
                  block={block}
                  onChange={(files, previews) => updateBlock(block.id, { files, previews })}
                  onRemove={() => removeBlock(block.id)}
                />
              )}
              {block.type === "video" && (
                <VideoBlockEditor
                  block={block}
                  onChange={(url, caption) =>
                    updateBlock(block.id, { url, caption, valid: !!getVideoEmbed(url) })
                  }
                  onRemove={() => removeBlock(block.id)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
          <AddBlockMenu onAdd={addBlock} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              发布手记
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
