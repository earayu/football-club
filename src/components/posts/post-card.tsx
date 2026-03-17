"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostPhotoGrid, type GridPhoto } from "./post-photo-grid";
import { VideoEmbed } from "./video-embed";
import {
  deletePost, togglePinPost, deleteBlock,
  appendTextBlock, appendVideoBlock, appendPhotosBlockFromUrls,
} from "@/lib/actions/posts";
import { validatePhotoFiles, uploadPhotosToStorage } from "@/lib/upload";
import {
  MapPin, PushPin, Trash, Plus, X,
  YoutubeLogo, Image as ImageIcon, CheckCircle, DotsThree,
  ArrowUp, SpinnerGap, Link as LinkIcon,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockItem = {
  id: string; body: string | null; url: string | null;
  video_url: string | null; video_caption: string | null; sort_order: number;
};

type Block = {
  id: string; type: "text" | "photos" | "video";
  author_id: string; sort_order: number; created_at: string;
  profiles: { display_name: string; avatar_url: string | null };
  post_block_items: BlockItem[];
};

export type PostData = {
  id: string; title: string | null; location: string | null;
  event_date: string; is_pinned: boolean; created_by: string; created_at: string;
  profiles: { display_name: string; avatar_url: string | null };
  post_blocks: Block[];
};

// Photo entry: either a local file or an already-hosted URL (e.g. dragged from browser)
type PhotoEntry =
  | { kind: "file"; file: File; preview: string }
  | { kind: "url";  url: string };

// A link card for non-image, non-video URLs
type LinkCard = { url: string; domain: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = "md" }: { url: string | null; name: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-5 w-5 text-[9px]" : "h-8 w-8 text-[13px]";
  if (url) return <img src={url} alt={name} className={`${cls} shrink-0 rounded-full object-cover`} />;
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-green-700 font-bold text-white`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const bili = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bili) return `https://player.bilibili.com/player.html?bvid=${bili[1]}&autoplay=0`;
  return null;
}

const IMAGE_URL_RE = /^https?:\/\/.+\.(jpe?g|png|gif|webp|heic|avif|bmp)(\?.*)?$/i;

// ─── Photo Grid ───────────────────────────────────────────────────────────────

function PhotoGrid({
  photos,
  onRemove,
  onAddMore,
}: {
  photos: PhotoEntry[];
  onRemove: (i: number) => void;
  onAddMore: () => void;
}) {
  const cols = photos.length === 1 ? "grid-cols-1" : photos.length === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className="space-y-1.5">
      <div className={`grid gap-0.5 overflow-hidden rounded-xl ${cols}`}>
        {photos.map((p, i) => (
          <div key={i} className="group/p relative aspect-square overflow-hidden bg-zinc-100">
            <img
              src={p.kind === "file" ? p.preview : p.url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover/p:scale-[1.04]"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm group-hover/p:flex hover:bg-red-500 transition-colors duration-150"
            >
              <X size={10} weight="bold" />
            </button>
          </div>
        ))}
      </div>
      {/* "Add more" button is always BELOW the grid, never inside it */}
      <button
        type="button"
        onClick={onAddMore}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-200 py-2 text-[11px] text-zinc-400 transition-all duration-200 hover:border-green-300 hover:bg-green-50/30 hover:text-green-600"
      >
        <Plus size={12} weight="bold" />
        继续添加照片
      </button>
    </div>
  );
}

// ─── Link Card ────────────────────────────────────────────────────────────────

function LinkCardItem({ card, onRemove }: { card: LinkCard; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/60 px-3.5 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${card.domain}&sz=64`}
          alt=""
          className="h-5 w-5"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-zinc-700">{card.domain}</p>
        <a
          href={card.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate block text-[11px] text-zinc-400 hover:text-green-600 transition-colors"
        >
          {card.url}
        </a>
      </div>
      <button type="button" onClick={onRemove} className="shrink-0 text-zinc-300 hover:text-red-400 transition-colors">
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Notion-style Append Editor ───────────────────────────────────────────────

function AppendEditor({
  postId, clubId, onClose,
}: {
  postId: string; clubId: string; onClose: () => void;
}) {
  const router = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCountRef = useRef(0);

  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [linkCards, setLinkCards] = useState<LinkCard[]>([]);
  const [sizeWarnings, setSizeWarnings] = useState<string[]>([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  const videoEmbedUrl = videoUrl ? getVideoEmbed(videoUrl) : null;
  const isValidVideo = !!videoEmbedUrl;
  const hasContent = text.trim() || photos.length > 0 || linkCards.length > 0 || (videoOpen && videoUrl.trim());

  // ── Photo helpers ──────────────────────────────────────────────────────────

  function addPhotoFiles(fl: File[] | FileList | null) {
    if (!fl) return;
    const arr = Array.from(fl);
    const { valid, sizeErrors } = validatePhotoFiles(arr);
    if (sizeErrors.length) setSizeWarnings(w => [...w, ...sizeErrors]);
    if (valid.length) {
      setPhotos(p => [...p, ...valid.map(f => ({ kind: "file" as const, file: f, preview: URL.createObjectURL(f) }))]);
    }
  }

  function addPhotoUrl(url: string) {
    setPhotos(p => [...p, { kind: "url" as const, url }]);
  }

  // ── URL detection ──────────────────────────────────────────────────────────

  function handleDetectedUrl(raw: string) {
    const url = raw.trim();
    if (!url.startsWith("http")) return false;

    // Video
    if (getVideoEmbed(url)) {
      setVideoUrl(url);
      setVideoOpen(true);
      return true;
    }
    // Image URL
    if (IMAGE_URL_RE.test(url)) {
      addPhotoUrl(url);
      return true;
    }
    // Generic link card
    try {
      const domain = new URL(url).hostname;
      setLinkCards(c => [...c, { url, domain }]);
      return true;
    } catch { return false; }
  }

  // ── Smart paste in textarea ────────────────────────────────────────────────

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    // Handle pasted image files (e.g. screenshot from clipboard)
    const imageFiles = Array.from(e.clipboardData.files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length) {
      e.preventDefault();
      addPhotoFiles(imageFiles);
      return;
    }

    const pasted = e.clipboardData.getData("text/plain").trim();
    if (!pasted) return;

    // Only intercept if textarea is currently empty (pure URL paste)
    if (text.trim() === "" && handleDetectedUrl(pasted)) {
      e.preventDefault();
    }
    // Otherwise let the text paste normally
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCountRef.current++;
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCountRef.current--;
    if (dragCountRef.current <= 0) {
      dragCountRef.current = 0;
      setIsDragOver(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCountRef.current = 0;
    setIsDragOver(false);

    // 1. Dropped image files (from file manager)
    const imageFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length) { addPhotoFiles(imageFiles); return; }

    // 2. Dropped URL/text (from browser tab, address bar, etc.)
    const dropped =
      e.dataTransfer.getData("text/uri-list")?.split("\n")[0]?.trim() ||
      e.dataTransfer.getData("text/plain")?.trim() ||
      "";

    if (dropped && !handleDetectedUrl(dropped)) {
      // Not recognized as a special URL — append to text
      setText(t => (t ? t + "\n" + dropped : dropped));
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!hasContent || uploading) return;
    setUploading(true);
    setError(null);

    try {
      const errs: string[] = [];

      // Text
      const fullText = [
        text.trim(),
        ...linkCards.map(c => c.url),
      ].filter(Boolean).join("\n");
      if (fullText) {
        const r = await appendTextBlock(postId, fullText) as any;
        if (r?.error) errs.push(r.error);
      }

      // Photos (files + URL-based)
      if (photos.length > 0) {
        const filePhotos = photos.filter(p => p.kind === "file") as Extract<PhotoEntry, {kind:"file"}>[];
        const urlPhotos  = photos.filter(p => p.kind === "url")  as Extract<PhotoEntry, {kind:"url"}>[];

        let uploadedUrls: string[] = [];
        if (filePhotos.length > 0) {
          setUploadProgress({ done: 0, total: filePhotos.length });
          const { urls, uploadErrors } = await uploadPhotosToStorage(
            filePhotos.map(p => p.file),
            `posts/${clubId}/${postId}`,
            (done, total) => setUploadProgress({ done, total }),
          );
          if (uploadErrors.length) errs.push(...uploadErrors);
          uploadedUrls = urls;
        }

        const allPhotoUrls = [...uploadedUrls, ...urlPhotos.map(p => p.url)];
        if (allPhotoUrls.length > 0) {
          const r = await appendPhotosBlockFromUrls(postId, allPhotoUrls) as any;
          if (r?.error) errs.push(r.error);
        }
      }

      // Video
      if (videoOpen && videoUrl.trim()) {
        const r = await appendVideoBlock(postId, videoUrl.trim(), videoCaption || undefined) as any;
        if (r?.error) errs.push(r.error);
      }

      if (errs.length) { setError(errs.join(" · ")); setUploading(false); return; }
      router.refresh();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "发布失败，请重试");
      setUploading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative border-t border-[rgba(0,0,0,0.05)] px-5 py-4 space-y-3 animate-fade-up transition-colors duration-200 ${isDragOver ? "bg-green-50/50" : ""}`}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-b-[1.25rem] border-2 border-dashed border-green-400 bg-green-50/80 backdrop-blur-[2px]">
          <ImageIcon size={28} weight="duotone" className="text-green-500" />
          <span className="text-[13px] font-semibold text-green-700">松开鼠标添加</span>
          <span className="text-[11px] text-green-600">支持图片文件、图片链接、视频链接</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="animate-fade-in rounded-xl bg-red-50 px-4 py-2.5 text-[12px] leading-relaxed text-red-600">
          {error}
        </div>
      )}

      {/* Size warnings */}
      {sizeWarnings.length > 0 && (
        <div className="animate-fade-in rounded-xl bg-amber-50 px-4 py-2.5 text-[12px] leading-relaxed text-amber-700">
          {sizeWarnings.map((w, i) => <div key={i}>{w}</div>)}
          <button type="button" onClick={() => setSizeWarnings([])} className="mt-1 text-amber-500 underline text-[11px]">关闭</button>
        </div>
      )}

      {/* Text area */}
      <textarea
        ref={textRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onPaste={handlePaste}
        placeholder="补充内容…按 Enter 换行，直接粘贴链接自动识别"
        rows={2}
        className="notion-block w-full text-[14px]"
        style={{ lineHeight: "1.8" }}
        onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
        onKeyDown={e => { if (e.key === "Escape") onClose(); }}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <PhotoGrid
          photos={photos}
          onRemove={i => setPhotos(p => p.filter((_, j) => j !== i))}
          onAddMore={() => photoInputRef.current?.click()}
        />
      )}

      {/* Link cards */}
      {linkCards.length > 0 && (
        <div className="space-y-1.5">
          {linkCards.map((card, i) => (
            <LinkCardItem key={i} card={card} onRemove={() => setLinkCards(c => c.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}

      {/* Video section */}
      {videoOpen && (
        <div className="animate-fade-up space-y-2">
          <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${isValidVideo ? "border-green-200 bg-green-50/30" : "border-zinc-200 bg-zinc-50"}`}>
            <YoutubeLogo size={14} weight="duotone" className={isValidVideo ? "text-green-600 shrink-0" : "text-zinc-300 shrink-0"} />
            <input
              autoFocus={!photos.length}
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="粘贴 YouTube 或 Bilibili 链接…"
              className="flex-1 bg-transparent text-[13px] text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
            />
            {isValidVideo
              ? <CheckCircle size={14} className="shrink-0 text-green-600" weight="fill" />
              : <button type="button" onClick={() => { setVideoOpen(false); setVideoUrl(""); }} className="text-zinc-300 hover:text-zinc-500"><X size={12} /></button>
            }
          </div>
          {videoEmbedUrl && (
            <div className="overflow-hidden rounded-xl bg-zinc-950">
              <div className="relative aspect-video">
                <iframe src={videoEmbedUrl} className="absolute inset-0 h-full w-full" allowFullScreen />
              </div>
            </div>
          )}
          {isValidVideo && (
            <input type="text" value={videoCaption} onChange={e => setVideoCaption(e.target.value)}
              placeholder="视频描述（可选）"
              className="w-full bg-transparent text-[12px] text-zinc-500 placeholder:text-zinc-300 focus:outline-none" />
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1.5">
        {/* Photo button */}
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          title="添加照片 (支持拖入)"
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${photos.length > 0 ? "border-green-200 bg-green-50 text-green-600" : "border-zinc-200 bg-white text-zinc-400 hover:border-green-200 hover:text-green-600"}`}
        >
          <ImageIcon size={13} weight="duotone" />
        </button>
        {/* Hidden file input — reset value after each use so same file can be re-added */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { addPhotoFiles(e.target.files); e.target.value = ""; }}
        />

        {/* Video button */}
        <button
          type="button"
          onClick={() => setVideoOpen(v => !v)}
          title="添加视频 (支持粘贴链接)"
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${videoOpen ? "border-green-200 bg-green-50 text-green-600" : "border-zinc-200 bg-white text-zinc-400 hover:border-green-200 hover:text-green-600"}`}
        >
          <YoutubeLogo size={13} weight="duotone" />
        </button>

        {/* Link card indicator */}
        {linkCards.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
            <LinkIcon size={11} /> {linkCards.length} 个链接
          </span>
        )}

        {/* Upload progress */}
        {uploading && uploadProgress.total > 0 && (
          <span className="ml-1 text-[11px] text-zinc-400 tabular-nums">
            上传 {uploadProgress.done}/{uploadProgress.total}
          </span>
        )}

        {/* Cancel + Submit */}
        <button type="button" onClick={onClose}
          className="ml-auto text-[12px] text-zinc-400 hover:text-zinc-600 transition-colors duration-150">
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasContent || uploading}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-white shadow-[0_2px_8px_rgba(21,128,61,0.25)] transition-all duration-200 hover:bg-green-800 hover:shadow-[0_4px_14px_rgba(21,128,61,0.35)] active:scale-[0.93] disabled:opacity-40"
        >
          {uploading
            ? <SpinnerGap size={12} className="animate-spin" />
            : <ArrowUp size={12} weight="bold" />
          }
        </button>
      </div>
    </div>
  );
}

// ─── Block content renderer ───────────────────────────────────────────────────

function BlockContent({ block, isFirst, currentUserId, isAdmin }: {
  block: Block; isFirst: boolean; currentUserId: string | null; isAdmin: boolean;
}) {
  const router = useRouter();
  const photos: GridPhoto[] = block.post_block_items
    .filter(i => i.url).sort((a, b) => a.sort_order - b.sort_order)
    .map(i => ({ id: i.id, url: i.url! }));
  const canDelete = isAdmin || block.author_id === currentUserId;

  return (
    <div>
      {!isFirst && (
        <div className="flex items-center gap-2 px-5 py-2 border-t border-[rgba(0,0,0,0.04)]">
          <Avatar url={block.profiles.avatar_url} name={block.profiles.display_name} size="sm" />
          <span className="text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-600">{block.profiles.display_name}</span>
            {" "}补充了 {block.type === "text" ? "文字" : block.type === "photos" ? `${photos.length} 张照片` : "视频"}
          </span>
          {canDelete && (
            <button onClick={async () => { if (!confirm("删除该内容块？")) return; await deleteBlock(block.id); router.refresh(); }}
              className="ml-auto text-[11px] text-zinc-300 transition-colors hover:text-red-400">
              删除
            </button>
          )}
        </div>
      )}
      {block.type === "text" && block.post_block_items[0]?.body && (
        <p className="px-5 py-1.5 text-[15px] leading-[1.85] text-zinc-700 whitespace-pre-wrap">
          {block.post_block_items[0].body}
        </p>
      )}
      {block.type === "photos" && photos.length > 0 && <PostPhotoGrid photos={photos} />}
      {block.type === "video" && block.post_block_items[0]?.video_url && (
        <div className="px-5 py-1.5">
          <VideoEmbed url={block.post_block_items[0].video_url} caption={block.post_block_items[0].video_caption} />
        </div>
      )}
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

export function PostCard({ post, currentUserId, isAdmin, clubId, clubSlug: _clubSlug }: {
  post: PostData; currentUserId: string | null; isAdmin: boolean;
  clubId: string; clubSlug: string;
}) {
  const router = useRouter();
  const [appendOpen, setAppendOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const canDelete = isAdmin || post.created_by === currentUserId;
  const hasMenu = isAdmin || canDelete;
  const blocks = [...post.post_blocks].sort((a, b) => a.sort_order - b.sort_order);
  const firstBlock = blocks[0];
  const hasHeroPhoto = firstBlock?.type === "photos";
  const heroPhotos: GridPhoto[] = hasHeroPhoto
    ? firstBlock.post_block_items.filter(i => i.url).sort((a, b) => a.sort_order - b.sort_order).map(i => ({ id: i.id, url: i.url! }))
    : [];

  const dateStr = new Date(post.event_date).toLocaleDateString("zh-CN", { month: "long", day: "numeric" });

  return (
    <article className={`overflow-hidden rounded-[1.25rem] bg-white transition-all duration-[350ms] ${
      post.is_pinned
        ? "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.08)] ring-1 ring-amber-300/30"
        : "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05),0_16px_40px_-8px_rgba(0,0,0,0.12)]"
    }`}>

      {hasHeroPhoto && heroPhotos.length > 0 && (
        <div className="overflow-hidden"><PostPhotoGrid photos={heroPhotos} /></div>
      )}

      <div className="flex items-center justify-between px-5 pt-4 pb-1.5">
        <div className="flex items-center gap-2.5">
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold leading-tight text-zinc-900">{post.profiles.display_name}</span>
              {post.is_pinned && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold leading-none text-amber-600">
                  <PushPin size={8} weight="fill" /> 置顶
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span>{dateStr}</span>
              {post.location && (
                <><span className="text-zinc-200">·</span>
                <span className="flex items-center gap-0.5"><MapPin size={9} /> {post.location}</span></>
              )}
            </div>
          </div>
        </div>

        {hasMenu && (
          <div ref={menuRef} className="relative">
            <button onClick={() => setMenuOpen(v => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-500">
              <DotsThree size={18} weight="bold" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 animate-scale-in min-w-[140px] overflow-hidden rounded-xl border border-[rgba(0,0,0,0.07)] bg-white py-1 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.14)]">
                {isAdmin && (
                  <button onClick={async () => { setMenuOpen(false); await togglePinPost(post.id, !post.is_pinned); router.refresh(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-zinc-700 transition-colors hover:bg-zinc-50">
                    <PushPin size={13} weight={post.is_pinned ? "fill" : "regular"} className={post.is_pinned ? "text-amber-400" : "text-zinc-400"} />
                    {post.is_pinned ? "取消置顶" : "置顶手记"}
                  </button>
                )}
                {canDelete && (
                  <button onClick={async () => { setMenuOpen(false); if (!confirm("确认删除该手记？")) return; await deletePost(post.id); router.refresh(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 transition-colors hover:bg-red-50">
                    <Trash size={13} /> 删除手记
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {post.title && (
        <h2 className="px-5 py-1 text-[16px] font-bold leading-snug text-zinc-900">{post.title}</h2>
      )}

      <div className="pb-2">
        {blocks.map((block, i) => {
          if (i === 0 && hasHeroPhoto) return null;
          return <BlockContent key={block.id} block={block} isFirst={i === 0} currentUserId={currentUserId} isAdmin={isAdmin} />;
        })}
      </div>

      {currentUserId && !appendOpen && (
        <div className="border-t border-[rgba(0,0,0,0.04)] px-5 py-2.5">
          <button type="button" onClick={() => setAppendOpen(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 transition-all duration-200 hover:text-green-700">
            <Plus size={13} weight="bold" /> 补充内容
          </button>
        </div>
      )}

      {currentUserId && appendOpen && (
        <AppendEditor postId={post.id} clubId={clubId} onClose={() => setAppendOpen(false)} />
      )}
    </article>
  );
}
