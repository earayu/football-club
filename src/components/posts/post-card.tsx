"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostPhotoGrid, type GridPhoto } from "./post-photo-grid";
import { VideoEmbed } from "./video-embed";
import {
  deletePost, togglePinPost, deleteBlock,
  appendTextBlock, appendVideoBlock, appendPhotosBlockFromUrls,
} from "@/lib/actions/posts";
import {
  validatePhotoFiles, uploadPhotosToStorage,
} from "@/lib/upload";
import {
  MapPin, PushPin, Trash, Plus, X,
  YoutubeLogo, Image as ImageIcon, CheckCircle, DotsThree,
  ArrowUp, SpinnerGap,
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

// ─── Notion-style Append Editor ───────────────────────────────────────────────
// Single unified panel — text, photos, and video all in one step.
// No "pick a type" screen. Just interact directly.

type PhotoEntry = { file: File; preview: string };

function AppendEditor({
  postId, clubId, onClose,
}: {
  postId: string; clubId: string; onClose: () => void;
}) {
  const router = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [sizeWarnings, setSizeWarnings] = useState<string[]>([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Auto-focus text area on mount
  useEffect(() => { textRef.current?.focus(); }, []);

  const videoEmbedUrl = videoUrl ? getVideoEmbed(videoUrl) : null;
  const isValidVideo = !!videoEmbedUrl;
  const hasContent = text.trim() || photos.length > 0 || (videoOpen && videoUrl.trim());

  function addPhotos(fl: FileList | null) {
    if (!fl) return;
    const files = Array.from(fl);
    const { valid, sizeErrors } = validatePhotoFiles(files);
    setSizeWarnings(sizeErrors);
    if (valid.length) {
      setPhotos(p => [
        ...p,
        ...valid.map(f => ({ file: f, preview: URL.createObjectURL(f) })),
      ]);
    }
  }

  function removePhoto(i: number) {
    setPhotos(p => {
      const next = p.filter((_, j) => j !== i);
      return next;
    });
  }

  async function handleSubmit() {
    if (!hasContent || uploading) return;
    setUploading(true);
    setError(null);

    try {
      const errs: string[] = [];

      // 1. Text
      if (text.trim()) {
        const r = await appendTextBlock(postId, text.trim()) as any;
        if (r?.error) errs.push(r.error);
      }

      // 2. Photos — upload directly from browser, then save URLs
      if (photos.length > 0) {
        setUploadProgress({ done: 0, total: photos.length });
        const { urls, uploadErrors } = await uploadPhotosToStorage(
          photos.map(p => p.file),
          `posts/${clubId}/${postId}`,
          (done, total) => setUploadProgress({ done, total }),
        );
        if (uploadErrors.length) errs.push(...uploadErrors);
        if (urls.length > 0) {
          const r = await appendPhotosBlockFromUrls(postId, urls) as any;
          if (r?.error) errs.push(r.error);
        }
      }

      // 3. Video
      if (videoOpen && videoUrl.trim()) {
        const r = await appendVideoBlock(postId, videoUrl.trim(), videoCaption || undefined) as any;
        if (r?.error) errs.push(r.error);
      }

      if (errs.length) {
        setError(errs.join(" · "));
        setUploading(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "发布失败，请重试");
      setUploading(false);
    }
  }

  return (
    <div className="border-t border-[rgba(0,0,0,0.05)] px-5 py-4 space-y-3 animate-fade-up">

      {/* ── Error ── */}
      {error && (
        <div className="animate-fade-in rounded-xl bg-red-50 px-4 py-2.5 text-[12px] leading-relaxed text-red-600">
          {error}
        </div>
      )}

      {/* ── Size warnings (soft, non-blocking) ── */}
      {sizeWarnings.length > 0 && (
        <div className="animate-fade-in rounded-xl bg-amber-50 px-4 py-2.5 text-[12px] leading-relaxed text-amber-700">
          {sizeWarnings.map((w, i) => <div key={i}>{w}</div>)}
        </div>
      )}

      {/* ── Text area — always visible, autofocused ── */}
      <textarea
        ref={textRef}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="补充内容……按 Enter 换行"
        rows={2}
        className="notion-block w-full text-[14px]"
        style={{ lineHeight: "1.8" }}
        onInput={e => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
        onKeyDown={e => {
          if (e.key === "Escape") onClose();
        }}
      />

      {/* ── Photo thumbnails — inline, no separate "upload" screen ── */}
      {photos.length > 0 && (
        <div className="overflow-hidden rounded-xl">
          <div className={`grid gap-0.5 ${
            photos.length === 1 ? "grid-cols-1"
            : photos.length === 2 ? "grid-cols-2"
            : "grid-cols-3"
          }`}>
            {photos.map((p, i) => (
              <div key={i} className="group/p relative aspect-square overflow-hidden bg-zinc-100">
                <img
                  src={p.preview}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/p:scale-[1.04]"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm group-hover/p:flex hover:bg-red-500 transition-colors duration-150"
                >
                  <X size={10} weight="bold" />
                </button>
              </div>
            ))}
            {/* Quick-add more photos */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 bg-zinc-50 hover:bg-zinc-100 transition-colors duration-150"
            >
              <Plus size={16} className="text-zinc-300" />
              <span className="text-[10px] text-zinc-300">更多</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Video URL input — toggled inline ── */}
      {videoOpen && (
        <div className="animate-fade-up space-y-2">
          <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${
            isValidVideo ? "border-green-200 bg-green-50/30" : "border-zinc-200 bg-zinc-50"
          }`}>
            <YoutubeLogo size={14} weight="duotone" className={isValidVideo ? "text-green-600 shrink-0" : "text-zinc-300 shrink-0"} />
            <input
              autoFocus
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
            <input
              type="text"
              value={videoCaption}
              onChange={e => setVideoCaption(e.target.value)}
              placeholder="视频描述（可选）"
              className="w-full bg-transparent text-[12px] text-zinc-500 placeholder:text-zinc-300 focus:outline-none"
            />
          )}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5">
        {/* Photo button — click directly triggers file picker */}
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          title="添加照片"
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
            photos.length > 0
              ? "border-green-200 bg-green-50 text-green-600"
              : "border-zinc-200 bg-white text-zinc-400 hover:border-green-200 hover:text-green-600"
          }`}
        >
          <ImageIcon size={13} weight="duotone" />
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => addPhotos(e.target.files)}
        />

        {/* Video button */}
        <button
          type="button"
          onClick={() => { setVideoOpen(v => !v); }}
          title="添加视频"
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
            videoOpen
              ? "border-green-200 bg-green-50 text-green-600"
              : "border-zinc-200 bg-white text-zinc-400 hover:border-green-200 hover:text-green-600"
          }`}
        >
          <YoutubeLogo size={13} weight="duotone" />
        </button>

        {/* Upload progress */}
        {uploading && uploadProgress.total > 0 && (
          <span className="ml-1 text-[11px] text-zinc-400">
            上传 {uploadProgress.done}/{uploadProgress.total}
          </span>
        )}

        {/* Cancel + Submit */}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-[12px] text-zinc-400 hover:text-zinc-600 transition-colors duration-150"
        >
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
            <button
              onClick={async () => {
                if (!confirm("删除该内容块？")) return;
                await deleteBlock(block.id);
                router.refresh();
              }}
              className="ml-auto text-[11px] text-zinc-300 transition-colors hover:text-red-400"
            >
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

      {/* Header */}
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
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-500"
            >
              <DotsThree size={18} weight="bold" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-20 mt-1.5 animate-scale-in min-w-[140px] overflow-hidden rounded-xl border border-[rgba(0,0,0,0.07)] bg-white py-1 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.14)]">
                {isAdmin && (
                  <button
                    onClick={async () => { setMenuOpen(false); await togglePinPost(post.id, !post.is_pinned); router.refresh(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <PushPin size={13} weight={post.is_pinned ? "fill" : "regular"} className={post.is_pinned ? "text-amber-400" : "text-zinc-400"} />
                    {post.is_pinned ? "取消置顶" : "置顶手记"}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={async () => { setMenuOpen(false); if (!confirm("确认删除该手记？")) return; await deletePost(post.id); router.refresh(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 transition-colors hover:bg-red-50"
                  >
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
          return (
            <BlockContent key={block.id} block={block} isFirst={i === 0}
              currentUserId={currentUserId} isAdmin={isAdmin} />
          );
        })}
      </div>

      {/* Append trigger / editor */}
      {currentUserId && !appendOpen && (
        <div className="border-t border-[rgba(0,0,0,0.04)] px-5 py-2.5">
          <button
            type="button"
            onClick={() => setAppendOpen(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 transition-all duration-200 hover:text-green-700"
          >
            <Plus size={13} weight="bold" /> 补充内容
          </button>
        </div>
      )}

      {currentUserId && appendOpen && (
        <AppendEditor
          postId={post.id}
          clubId={clubId}
          onClose={() => setAppendOpen(false)}
        />
      )}
    </article>
  );
}
