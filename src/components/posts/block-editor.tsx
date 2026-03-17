"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  YoutubeLogo,
  X,
  MapPin,
  Calendar,
  CheckCircle,
  ArrowUp,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { createPost, appendTextBlock, appendPhotosBlock, appendVideoBlock } from "@/lib/actions/posts";

// ─── Types ────────────────────────────────────────────────────────────────────

type TextBlock   = { id: string; type: "text";   content: string };
type PhotoBlock  = { id: string; type: "photos"; files: File[]; previews: string[] };
type VideoBlock  = { id: string; type: "video";  url: string; caption: string; valid: boolean };
type Block = TextBlock | PhotoBlock | VideoBlock;

function uid() { return Math.random().toString(36).slice(2, 9); }
function makeTextBlock(): TextBlock { return { id: uid(), type: "text", content: "" }; }
function makePhotoBlock(): PhotoBlock { return { id: uid(), type: "photos", files: [], previews: [] }; }
function makeVideoBlock(): VideoBlock { return { id: uid(), type: "video", url: "", caption: "", valid: false }; }

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const bili = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bili) return `https://player.bilibili.com/player.html?bvid=${bili[1]}&autoplay=0`;
  return null;
}

// ─── Auto-resize helper ───────────────────────────────────────────────────────

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

// ─── Text Block ───────────────────────────────────────────────────────────────

function NotionTextBlock({
  block, index, total,
  onChange, onRemove, onEnter, autoFocus,
}: {
  block: TextBlock;
  index: number; total: number;
  onChange: (c: string) => void;
  onRemove: () => void;
  onEnter: () => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current) { ref.current.focus(); autoResize(ref.current); }
  }, [autoFocus]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    }
    if (e.key === "Backspace" && block.content === "" && total > 1) {
      e.preventDefault();
      onRemove();
    }
  }

  return (
    <div className="group/block relative">
      <textarea
        ref={ref}
        value={block.content}
        autoFocus={autoFocus}
        onChange={e => { onChange(e.target.value); autoResize(e.target); }}
        onKeyDown={handleKeyDown}
        placeholder={index === 0 ? "写点什么，分享今天的故事…" : "继续写…"}
        rows={1}
        className="notion-block text-[15px] py-0.5 min-h-[28px]"
        style={{ lineHeight: "1.8" }}
      />
      {total > 1 && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-7 top-0.5 hidden h-5 w-5 items-center justify-center rounded-full text-zinc-300 hover:text-red-400 group-hover/block:flex transition-colors"
        >
          <Trash size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Photo Block ──────────────────────────────────────────────────────────────

function NotionPhotoBlock({
  block, onAddFiles, onRemoveFile, onRemoveBlock,
}: {
  block: PhotoBlock;
  onAddFiles: (f: File[], p: string[]) => void;
  onRemoveFile: (i: number) => void;
  onRemoveBlock: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    onAddFiles(arr, arr.map(f => URL.createObjectURL(f)));
  }

  if (block.previews.length === 0) {
    return (
      <div className="group/block relative">
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
            dragging
              ? "bg-green-50 border border-dashed border-green-300"
              : "bg-zinc-50 border border-dashed border-zinc-200 hover:bg-green-50/50 hover:border-green-200"
          }`}
        >
          <ImageIcon size={18} weight="duotone" className="text-zinc-400" />
          <span className="text-[13px] text-zinc-400">拖入或点击上传照片</span>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />
        </div>
        <button type="button" onClick={onRemoveBlock}
          className="absolute -right-7 top-2.5 hidden h-5 w-5 items-center justify-center rounded-full text-zinc-300 hover:text-red-400 group-hover/block:flex transition-colors">
          <Trash size={11} />
        </button>
      </div>
    );
  }

  return (
    <div className="group/block relative">
      <div className="overflow-hidden rounded-xl">
        <div className={`grid gap-0.5 ${block.previews.length === 1 ? "grid-cols-1" : block.previews.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {block.previews.map((url, i) => (
            <div key={i} className="group/p relative aspect-square overflow-hidden bg-zinc-100">
              <img src={url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover/p:scale-[1.04]" />
              <button
                type="button"
                onClick={() => onRemoveFile(i)}
                className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm group-hover/p:flex hover:bg-red-500 transition-colors"
              >
                <X size={10} weight="bold" />
              </button>
            </div>
          ))}
          {/* Add more photos cell */}
          <div
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 bg-zinc-50 hover:bg-zinc-100 transition-colors"
          >
            <Plus size={18} className="text-zinc-300" />
            <span className="text-[10px] text-zinc-300">更多</span>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} />
          </div>
        </div>
      </div>
      <button type="button" onClick={onRemoveBlock}
        className="absolute -right-7 top-1.5 hidden h-5 w-5 items-center justify-center rounded-full text-zinc-300 hover:text-red-400 group-hover/block:flex transition-colors">
        <Trash size={11} />
      </button>
    </div>
  );
}

// ─── Video Block ──────────────────────────────────────────────────────────────

function NotionVideoBlock({
  block, onChange, onRemove,
}: {
  block: VideoBlock;
  onChange: (url: string, caption: string) => void;
  onRemove: () => void;
}) {
  const embedUrl = block.url ? getVideoEmbed(block.url) : null;

  return (
    <div className="group/block relative space-y-2">
      <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
        block.valid ? "border-green-200 bg-green-50/30" : "border-zinc-200 bg-zinc-50/60"
      }`}>
        <YoutubeLogo size={15} weight="duotone" className={block.valid ? "text-green-600 shrink-0" : "text-zinc-300 shrink-0"} />
        <input
          type="url"
          value={block.url}
          onChange={e => onChange(e.target.value, block.caption)}
          placeholder="粘贴 YouTube 或 Bilibili 链接…"
          className="flex-1 bg-transparent text-[13px] text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
        />
        {block.valid && <CheckCircle size={14} className="shrink-0 text-green-600" weight="fill" />}
      </div>
      {embedUrl && (
        <div className="overflow-hidden rounded-xl bg-zinc-950 shadow-sm">
          <div className="relative aspect-video">
            <iframe src={embedUrl} className="absolute inset-0 h-full w-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        </div>
      )}
      {block.valid && (
        <input type="text" value={block.caption} onChange={e => onChange(block.url, e.target.value)}
          placeholder="视频描述（可选）"
          className="w-full bg-transparent text-xs text-zinc-500 placeholder:text-zinc-300 focus:outline-none pl-0.5" />
      )}
      <button type="button" onClick={onRemove}
        className="absolute -right-7 top-2 hidden h-5 w-5 items-center justify-center rounded-full text-zinc-300 hover:text-red-400 group-hover/block:flex transition-colors">
        <Trash size={11} />
      </button>
    </div>
  );
}

// ─── Add Block Menu ───────────────────────────────────────────────────────────

function AddBlockButton({ onAdd }: { onAdd: (t: "text" | "photos" | "video") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const options = [
    { type: "text" as const,   Icon: () => <span className="text-[13px] font-bold text-zinc-400">T</span>, label: "文字" },
    { type: "photos" as const, Icon: () => <ImageIcon size={14} weight="duotone" className="text-zinc-400" />, label: "照片" },
    { type: "video" as const,  Icon: () => <YoutubeLogo size={14} weight="duotone" className="text-zinc-400" />, label: "视频" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
          open ? "border-green-300 bg-green-50 text-green-600 rotate-45" : "border-zinc-200 bg-white text-zinc-400 hover:border-green-300 hover:text-green-600"
        }`}
      >
        <Plus size={13} weight="bold" className="transition-transform duration-200" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2.5 animate-scale-in overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-1.5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.14)]">
          <div className="flex gap-0.5">
            {options.map(({ type, Icon, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => { onAdd(type); setOpen(false); }}
                className="flex flex-col items-center gap-1.5 rounded-xl px-5 py-3 text-zinc-600 transition-colors hover:bg-zinc-50 active:scale-[0.97]"
              >
                <Icon />
                <span className="text-[11px] font-medium text-zinc-500">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main BlockEditor ─────────────────────────────────────────────────────────

export function BlockEditor({
  clubId, userAvatarUrl, userInitial,
}: {
  clubId: string; userAvatarUrl?: string | null; userInitial: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [blocks, setBlocks] = useState<Block[]>([makeTextBlock()]);
  const titleRef = useRef<HTMLInputElement>(null);
  const lastBlockIdRef = useRef<string | null>(null);

  const addBlock = useCallback((type: "text" | "photos" | "video") => {
    const block = type === "text" ? makeTextBlock() : type === "photos" ? makePhotoBlock() : makeVideoBlock();
    if (type === "text") lastBlockIdRef.current = block.id;
    setBlocks(p => [...p, block]);
  }, []);

  function insertTextBlockAfter(afterIndex: number) {
    const block = makeTextBlock();
    lastBlockIdRef.current = block.id;
    setBlocks(p => {
      const copy = [...p];
      copy.splice(afterIndex + 1, 0, block);
      return copy;
    });
  }

  function updateBlock(id: string, updater: (b: Block) => Block): void;
  function updateBlock(id: string, updates: Partial<Block>): void;
  function updateBlock(id: string, arg: Partial<Block> | ((b: Block) => Block)) {
    setBlocks(p => p.map(b => {
      if (b.id !== id) return b;
      return typeof arg === "function" ? arg(b) : { ...b, ...arg } as Block;
    }));
  }

  function removeBlock(id: string) {
    setBlocks(p => {
      if (p.length === 1) return p;
      const filtered = p.filter(b => b.id !== id);
      // Focus the block before the removed one
      const idx = p.findIndex(b => b.id === id);
      const target = p[Math.max(0, idx - 1)];
      if (target?.type === "text") lastBlockIdRef.current = null;
      return filtered;
    });
  }

  function handleClose() {
    setOpen(false);
    setTitle(""); setLocation(""); setError(null);
    setEventDate(new Date().toISOString().slice(0, 10));
    setBlocks([makeTextBlock()]);
    lastBlockIdRef.current = null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);

    const res = await createPost(clubId, {
      title: title.trim() || undefined,
      location: location.trim() || undefined,
      eventDate,
    }) as any;

    if (res.error || !res.post) { setError(res.error ?? "发布失败"); setSaving(false); return; }

    const postId = res.post.id;
    const errors: string[] = [];
    for (const block of blocks) {
      if (block.type === "text" && block.content.trim()) {
        const r = await appendTextBlock(postId, block.content.trim()) as any;
        if (r?.error) errors.push(r.error);
      } else if (block.type === "photos" && block.files.length > 0) {
        const fd = new FormData();
        block.files.forEach(f => fd.append("photos", f));
        const r = await appendPhotosBlock(postId, fd) as any;
        if (r?.error) errors.push(r.error);
      } else if (block.type === "video" && block.url.trim()) {
        const r = await appendVideoBlock(postId, block.url.trim(), block.caption || undefined) as any;
        if (r?.error) errors.push(r.error);
      }
    }

    setSaving(false);
    if (errors.length > 0) {
      setError(errors.join(" · "));
      return;
    }
    handleClose(); router.refresh();
  }

  // ── Collapsed state ──────────────────────────────────────────────────────────

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); setTimeout(() => titleRef.current?.focus(), 50); }}
        className="group flex w-full items-center gap-3 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.06)] transition-all duration-[350ms] hover:border-green-200/60 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_30px_-8px_rgba(0,0,0,0.1)]"
      >
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm" alt="" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-[13px] font-bold text-white ring-2 ring-white shadow-sm">
            {userInitial}
          </div>
        )}
        <span className="flex-1 text-left text-[14px] text-zinc-400 group-hover:text-zinc-500 transition-colors duration-200">
          今天发生了什么？
        </span>
        <div className="flex items-center gap-2 text-zinc-300 transition-colors duration-200 group-hover:text-zinc-400">
          <ImageIcon size={15} weight="duotone" />
          <YoutubeLogo size={15} weight="duotone" />
        </div>
      </button>
    );
  }

  // ── Expanded state ───────────────────────────────────────────────────────────

  const textBlockCount = blocks.filter(b => b.type === "text").length;

  return (
    <div className="editor-surface animate-scale-in overflow-hidden">

      {/* ── Header bar ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[rgba(0,0,0,0.05)]">
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-7 w-7 shrink-0 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-700 text-[11px] font-bold text-white">
            {userInitial}
          </div>
        )}
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="标题（可选）"
          className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleClose}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all duration-150"
        >
          <X size={12} weight="bold" />
        </button>
      </div>

      {/* ── Content canvas ── */}
      <form onSubmit={handleSubmit}>
        <div className="min-h-[120px] px-5 pt-4 pb-3 space-y-3" style={{ paddingRight: "3rem" }}>
          {error && (
            <div className="animate-fade-in rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
          )}
          {blocks.map((block, i) => (
            <div key={block.id} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              {block.type === "text" && (
                <NotionTextBlock
                  block={block}
                  index={i}
                  total={textBlockCount}
                  autoFocus={block.id === lastBlockIdRef.current || (i === 0 && !lastBlockIdRef.current)}
                  onChange={c => updateBlock(block.id, { content: c })}
                  onRemove={() => removeBlock(block.id)}
                  onEnter={() => insertTextBlockAfter(i)}
                />
              )}
              {block.type === "photos" && (
                <NotionPhotoBlock
                  block={block}
                  onAddFiles={(f, p) => updateBlock(block.id, (b) => ({
                    ...b,
                    files: [...(b as PhotoBlock).files, ...f],
                    previews: [...(b as PhotoBlock).previews, ...p],
                  }))}
                  onRemoveFile={idx => updateBlock(block.id, (b) => ({
                    ...b,
                    files: (b as PhotoBlock).files.filter((_, j) => j !== idx),
                    previews: (b as PhotoBlock).previews.filter((_, j) => j !== idx),
                  }))}
                  onRemoveBlock={() => removeBlock(block.id)}
                />
              )}
              {block.type === "video" && (
                <NotionVideoBlock
                  block={block}
                  onChange={(url, cap) => updateBlock(block.id, { url, caption: cap, valid: !!getVideoEmbed(url) })}
                  onRemove={() => removeBlock(block.id)}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Bottom toolbar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <AddBlockButton onAdd={addBlock} />

            {/* Location */}
            <label className="flex items-center gap-1.5 cursor-pointer group/loc">
              <MapPin size={12} className="text-zinc-300 group-hover/loc:text-zinc-400 transition-colors" />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="地点"
                className="w-16 bg-transparent text-[12px] text-zinc-500 placeholder:text-zinc-300 focus:outline-none"
              />
            </label>

            {/* Date */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Calendar size={12} className="text-zinc-300" />
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="bg-transparent text-[12px] text-zinc-500 focus:outline-none"
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="group flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white shadow-[0_2px_8px_rgba(21,128,61,0.3)] transition-all duration-[250ms] cubic-bezier(0.32,0.72,0,1) hover:bg-green-800 hover:shadow-[0_4px_16px_rgba(21,128,61,0.4)] active:scale-[0.94] disabled:opacity-60"
          >
            {saving ? (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <ArrowUp size={14} weight="bold" className="transition-transform duration-200 group-hover:-translate-y-px" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
