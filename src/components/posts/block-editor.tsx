"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TextT,
  Image as ImageIcon,
  YoutubeLogo,
  Plus,
  X,
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  createPost,
  appendTextBlock,
  appendPhotosBlock,
  appendVideoBlock,
} from "@/lib/actions/posts";

type TextBlock = { id: string; type: "text"; content: string };
type PhotoBlock = { id: string; type: "photos"; files: File[]; previews: string[] };
type VideoBlock = { id: string; type: "video"; url: string; caption: string; valid: boolean };
type Block = TextBlock | PhotoBlock | VideoBlock;

function makeId() { return Math.random().toString(36).slice(2); }

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const bili = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bili) return `https://player.bilibili.com/player.html?bvid=${bili[1]}&autoplay=0`;
  return null;
}

// ─── Block editors ────────────────────────────────────────────────────────────

function TextBlockEditor({ block, onChange, onRemove, autoFocus }: {
  block: TextBlock; onChange: (c: string) => void; onRemove: () => void; autoFocus?: boolean;
}) {
  return (
    <div className="group relative">
      <textarea
        autoFocus={autoFocus}
        value={block.content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write something..."
        className="min-h-[80px] w-full resize-none bg-transparent py-1 text-[15px] leading-relaxed text-zinc-800 placeholder:text-zinc-300 focus:outline-none"
        onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
      />
      <button type="button" onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 hover:bg-red-100 hover:text-red-500 group-hover:flex">
        <X size={10} weight="bold" />
      </button>
    </div>
  );
}

function PhotoBlockEditor({ block, onChange, onRemove }: {
  block: PhotoBlock; onChange: (f: File[], p: string[]) => void; onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    onChange([...block.files, ...arr], [...block.previews, ...arr.map(f => URL.createObjectURL(f))]);
  }

  return (
    <div className="group relative space-y-2.5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed py-7 transition ${dragging ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-green-300"}`}
      >
        <ImageIcon size={24} weight="duotone" className={dragging ? "text-green-500" : "text-zinc-300"} />
        <p className="text-sm font-medium text-zinc-400">
          {block.files.length > 0 ? "Add more photos" : "Drag & drop or click to upload"}
        </p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>
      {block.previews.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {block.previews.map((url, i) => (
            <div key={i} className="group/p relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => onChange(block.files.filter((_,j)=>j!==i), block.previews.filter((_,j)=>j!==i))}
                className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white group-hover/p:flex hover:bg-red-500">
                <X size={9} weight="bold" />
              </button>
            </div>
          ))}
          <p className="col-span-5 text-xs text-zinc-400">{block.previews.length} selected</p>
        </div>
      )}
      <button type="button" onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 hover:bg-red-100 hover:text-red-500 group-hover:flex">
        <X size={10} weight="bold" />
      </button>
    </div>
  );
}

function VideoBlockEditor({ block, onChange, onRemove }: {
  block: VideoBlock; onChange: (url: string, caption: string) => void; onRemove: () => void;
}) {
  const embedUrl = block.url ? getVideoEmbed(block.url) : null;
  return (
    <div className="group relative space-y-2.5">
      <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition ${block.valid ? "border-green-200 bg-green-50/40" : "border-slate-200 bg-zinc-50/60"}`}>
        <YoutubeLogo size={16} weight="duotone" className={block.valid ? "text-green-600 shrink-0" : "text-zinc-300 shrink-0"} />
        <input type="url" value={block.url} onChange={(e) => onChange(e.target.value, block.caption)}
          placeholder="Paste a YouTube or Bilibili URL..."
          className="flex-1 bg-transparent text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none" />
        {block.valid && <CheckCircle size={15} className="shrink-0 text-green-600" weight="fill" />}
      </div>
      {embedUrl && (
        <div className="overflow-hidden rounded-xl bg-zinc-950">
          <div className="relative aspect-video"><iframe src={embedUrl} className="absolute inset-0 h-full w-full" allowFullScreen /></div>
        </div>
      )}
      {block.valid && (
        <input type="text" value={block.caption} onChange={(e) => onChange(block.url, e.target.value)}
          placeholder="Caption (optional)"
          className="w-full bg-transparent text-xs text-zinc-500 placeholder:text-zinc-300 focus:outline-none" />
      )}
      <button type="button" onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-zinc-500 hover:bg-red-100 hover:text-red-500 group-hover:flex">
        <X size={10} weight="bold" />
      </button>
    </div>
  );
}

function AddBlockMenu({ onAdd }: { onAdd: (t: Block["type"]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600">
        <Plus size={13} weight="bold" className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`} />
        Add content
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 flex gap-1 rounded-xl border border-slate-200/70 bg-white p-1.5 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)]">
          {[
            { type: "text" as const, Icon: TextT, label: "Text" },
            { type: "photos" as const, Icon: ImageIcon, label: "Photos" },
            { type: "video" as const, Icon: YoutubeLogo, label: "Video" },
          ].map(({ type, Icon, label }) => (
            <button key={type} type="button" onClick={() => { onAdd(type); setOpen(false); }}
              className="flex flex-col items-center gap-1 rounded-lg px-4 py-2.5 text-zinc-600 transition hover:bg-zinc-50">
              <Icon size={18} weight="duotone" />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main BlockEditor ─────────────────────────────────────────────────────────

export function BlockEditor({ clubId, userAvatarUrl, userInitial }: {
  clubId: string; userAvatarUrl?: string | null; userInitial: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [blocks, setBlocks] = useState<Block[]>([{ id: makeId(), type: "text", content: "" }]);

  function addBlock(type: Block["type"]) {
    const block: Block = type === "text" ? { id: makeId(), type: "text", content: "" }
      : type === "photos" ? { id: makeId(), type: "photos", files: [], previews: [] }
      : { id: makeId(), type: "video", url: "", caption: "", valid: false };
    setBlocks(p => [...p, block]);
  }

  function updateBlock(id: string, updates: Partial<Block>) {
    setBlocks(p => p.map(b => b.id === id ? { ...b, ...updates } as Block : b));
  }

  function removeBlock(id: string) {
    setBlocks(p => p.length === 1 ? p : p.filter(b => b.id !== id));
  }

  function handleClose() {
    setOpen(false); setTitle(""); setLocation(""); setError(null);
    setEventDate(new Date().toISOString().slice(0, 16));
    setBlocks([{ id: makeId(), type: "text", content: "" }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);

    const postResult = await createPost(clubId, { title: title.trim() || undefined, location: location.trim() || undefined, eventDate }) as any;
    if (postResult.error || !postResult.post) { setError(postResult.error ?? "Failed"); setSaving(false); return; }

    const postId = postResult.post.id;
    for (const block of blocks) {
      if (block.type === "text" && block.content.trim()) await appendTextBlock(postId, block.content.trim());
      else if (block.type === "photos" && block.files.length > 0) {
        const fd = new FormData(); block.files.forEach(f => fd.append("photos", f));
        await appendPhotosBlock(postId, fd);
      } else if (block.type === "video" && block.url.trim()) await appendVideoBlock(postId, block.url.trim(), block.caption || undefined);
    }
    setSaving(false); handleClose(); router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-card transition hover:border-green-300 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1)]">
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-9 w-9 shrink-0 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">{userInitial}</div>
        )}
        <span className="flex-1 text-left text-sm text-zinc-400">Write a journal entry...</span>
        <div className="flex items-center gap-2 text-zinc-300">
          <ImageIcon size={15} /><YoutubeLogo size={15} /><TextT size={15} />
        </div>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-8 w-8 shrink-0 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">{userInitial}</div>
        )}
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title..."
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-zinc-800 placeholder:text-zinc-300 focus:outline-none" />
        <div className="flex shrink-0 items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600">
            <MapPin size={12} />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location"
              className="w-20 bg-transparent text-xs placeholder:text-zinc-300 focus:outline-none" />
          </label>
          <label className="flex items-center gap-1 text-xs text-zinc-400">
            <Calendar size={12} />
            <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)}
              className="bg-transparent text-xs focus:outline-none" />
          </label>
        </div>
        <button onClick={handleClose} className="shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-100">
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Canvas */}
      <form onSubmit={handleSubmit}>
        <div className="min-h-[140px] space-y-3 px-5 pt-4 pb-2">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          {blocks.map((block, i) => (
            <div key={block.id}>
              {block.type === "text" && (
                <TextBlockEditor block={block} autoFocus={i === 0}
                  onChange={c => updateBlock(block.id, { content: c })}
                  onRemove={() => removeBlock(block.id)} />
              )}
              {block.type === "photos" && (
                <PhotoBlockEditor block={block}
                  onChange={(f, p) => updateBlock(block.id, { files: f, previews: p })}
                  onRemove={() => removeBlock(block.id)} />
              )}
              {block.type === "video" && (
                <VideoBlockEditor block={block}
                  onChange={(url, cap) => updateBlock(block.id, { url, caption: cap, valid: !!getVideoEmbed(url) })}
                  onRemove={() => removeBlock(block.id)} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <AddBlockMenu onAdd={addBlock} />
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleClose}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2 text-sm font-bold text-white shadow-sm shadow-green-900/20 transition hover:bg-green-800 active:scale-[0.98] disabled:opacity-60">
              {saving ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : <ArrowRight size={14} weight="bold" />}
              Publish
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
