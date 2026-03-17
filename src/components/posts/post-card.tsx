"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PostPhotoGrid, type GridPhoto } from "./post-photo-grid";
import { VideoEmbed } from "./video-embed";
import {
  deletePost, togglePinPost, deleteBlock,
  appendTextBlock, appendPhotosBlock, appendVideoBlock,
} from "@/lib/actions/posts";
import {
  MapPin, PushPin, Trash, Plus, X,
  YoutubeLogo, Image as ImageIcon, CheckCircle, DotsThree,
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

// ─── Append Block Editor (inline on existing posts) ───────────────────────────

function AppendEditor({ postId, onClose }: { postId: string; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"pick" | "text" | "photos" | "video">("pick");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // text
  const [text, setText] = useState("");
  // photos
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // video
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "text" && textAreaRef.current) textAreaRef.current.focus();
  }, [mode]);

  function handlePhotoFiles(fl: FileList | null) {
    if (!fl) return;
    const arr = Array.from(fl).filter(f => f.type.startsWith("image/"));
    setFiles(p => [...p, ...arr]);
    setPreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))]);
  }

  async function handleSubmit() {
    setSaving(true); setError(null);
    try {
      if (mode === "text" && text.trim()) {
        const r = await appendTextBlock(postId, text.trim()) as any;
        if (r?.error) { setError(r.error); setSaving(false); return; }
      } else if (mode === "photos" && files.length > 0) {
        const fd = new FormData(); files.forEach(f => fd.append("photos", f));
        const r = await appendPhotosBlock(postId, fd) as any;
        if (r?.error) { setError(r.error); setSaving(false); return; }
      } else if (mode === "video" && videoUrl.trim()) {
        const r = await appendVideoBlock(postId, videoUrl.trim(), videoCaption || undefined) as any;
        if (r?.error) { setError(r.error); setSaving(false); return; }
      }
      router.refresh(); onClose();
    } catch { setError("提交失败，请重试"); setSaving(false); }
  }

  const videoEmbedUrl = videoUrl ? getVideoEmbed(videoUrl) : null;
  const isValidVideo = !!videoEmbedUrl;

  return (
    <div className="border-t border-[rgba(0,0,0,0.05)] animate-fade-up">
      {error && <div className="px-5 pt-3 text-xs text-red-500">{error}</div>}

      {/* Mode picker */}
      {mode === "pick" && (
        <div className="flex items-center gap-2 px-5 py-3.5">
          <span className="text-[11px] font-medium text-zinc-400 mr-1">补充：</span>
          {[
            { m: "text" as const,   Icon: () => <span className="text-[12px] font-bold">T</span>,  label: "文字" },
            { m: "photos" as const, Icon: () => <ImageIcon size={13} weight="duotone" />,           label: "照片" },
            { m: "video" as const,  Icon: () => <YoutubeLogo size={13} weight="duotone" />,         label: "视频" },
          ].map(({ m, Icon, label }) => (
            <button
              key={m} type="button" onClick={() => setMode(m)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[12px] text-zinc-600 transition-all duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 active:scale-[0.97]"
            >
              <Icon />{label}
            </button>
          ))}
          <button type="button" onClick={onClose} className="ml-auto text-zinc-300 hover:text-zinc-500 transition-colors">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Text editor */}
      {mode === "text" && (
        <div className="px-5 pb-4 pt-3 space-y-3">
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="写点什么…"
            rows={3}
            className="notion-block text-[14px]"
            style={{ lineHeight: "1.8" }}
            onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
          />
          <AppendActions onSubmit={handleSubmit} onBack={() => setMode("pick")} saving={saving}
            disabled={!text.trim()} />
        </div>
      )}

      {/* Photo editor */}
      {mode === "photos" && (
        <div className="px-5 pb-4 pt-3 space-y-3">
          {previews.length === 0 ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handlePhotoFiles(e.dataTransfer.files); }}
              onClick={() => photoInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl py-8 transition-all duration-300 ${
                dragging ? "bg-green-50 border border-dashed border-green-300" : "bg-zinc-50 border border-dashed border-zinc-200 hover:bg-green-50/40 hover:border-green-200"
              }`}
            >
              <ImageIcon size={20} weight="duotone" className="text-zinc-300" />
              <p className="text-[12px] text-zinc-400">拖入或点击上传照片</p>
              <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => handlePhotoFiles(e.target.files)} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`grid gap-1 overflow-hidden rounded-xl ${previews.length === 1 ? "grid-cols-1" : previews.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {previews.map((url, i) => (
                  <div key={i} className="group/p relative aspect-square overflow-hidden bg-zinc-100">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => { setFiles(p => p.filter((_,j) => j!==i)); setPreviews(p => p.filter((_,j) => j!==i)); }}
                      className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white group-hover/p:flex hover:bg-red-500">
                      <X size={9} weight="bold" />
                    </button>
                  </div>
                ))}
                <div onClick={() => photoInputRef.current?.click()}
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 bg-zinc-50 hover:bg-zinc-100 transition-colors">
                  <Plus size={16} className="text-zinc-300" />
                  <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handlePhotoFiles(e.target.files)} />
                </div>
              </div>
            </div>
          )}
          <AppendActions onSubmit={handleSubmit} onBack={() => setMode("pick")} saving={saving}
            disabled={files.length === 0} />
        </div>
      )}

      {/* Video editor */}
      {mode === "video" && (
        <div className="px-5 pb-4 pt-3 space-y-3">
          <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all duration-300 ${isValidVideo ? "border-green-200 bg-green-50/30" : "border-zinc-200 bg-zinc-50"}`}>
            <YoutubeLogo size={14} weight="duotone" className={isValidVideo ? "text-green-600 shrink-0" : "text-zinc-300 shrink-0"} />
            <input autoFocus type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              placeholder="粘贴 YouTube 或 Bilibili 链接…"
              className="flex-1 bg-transparent text-[13px] text-zinc-700 placeholder:text-zinc-400 focus:outline-none" />
            {isValidVideo && <CheckCircle size={13} className="shrink-0 text-green-600" weight="fill" />}
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
          <AppendActions onSubmit={handleSubmit} onBack={() => setMode("pick")} saving={saving}
            disabled={!videoUrl.trim()} />
        </div>
      )}
    </div>
  );
}

function AppendActions({ onSubmit, onBack, saving, disabled }: {
  onSubmit: () => void; onBack: () => void; saving: boolean; disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={onBack}
        className="text-[12px] text-zinc-400 hover:text-zinc-600 transition-colors">
        ← 返回
      </button>
      <button type="button" onClick={onSubmit} disabled={saving || disabled}
        className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-1.5 text-[12px] font-bold text-white shadow-[0_2px_8px_rgba(21,128,61,0.25)] transition-all duration-200 hover:bg-green-800 active:scale-[0.97] disabled:opacity-40">
        {saving && (
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        发布
      </button>
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
      {/* Contributor header for non-first blocks */}
      {!isFirst && (
        <div className="flex items-center gap-2 px-5 py-2 border-t border-[rgba(0,0,0,0.04)]">
          <Avatar url={block.profiles.avatar_url} name={block.profiles.display_name} size="sm" />
          <span className="text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-600">{block.profiles.display_name}</span>
            {" "}补充了 {block.type === "text" ? "文字" : block.type === "photos" ? `${photos.length} 张照片` : "视频"}
          </span>
          {canDelete && (
            <button
              onClick={async () => { if (!confirm("删除该内容块？")) return; await deleteBlock(block.id); router.refresh(); }}
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

export function PostCard({ post, currentUserId, isAdmin, clubSlug: _clubSlug }: {
  post: PostData; currentUserId: string | null; isAdmin: boolean; clubSlug: string;
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

  const date = new Date(post.event_date);
  const dateStr = date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });

  return (
    <article className={`overflow-hidden rounded-[1.25rem] bg-white transition-all duration-[350ms] cubic-bezier(0.32,0.72,0,1) ${
      post.is_pinned
        ? "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.08)] ring-1 ring-amber-300/30"
        : "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05),0_16px_40px_-8px_rgba(0,0,0,0.12)]"
    }`}>

      {/* Full-bleed hero photo */}
      {hasHeroPhoto && heroPhotos.length > 0 && (
        <div className="overflow-hidden">
          <PostPhotoGrid photos={heroPhotos} />
        </div>
      )}

      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1.5">
        <div className="flex items-center gap-2.5">
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold leading-tight text-zinc-900">
                {post.profiles.display_name}
              </span>
              {post.is_pinned && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold leading-none text-amber-600">
                  <PushPin size={8} weight="fill" /> 置顶
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span>{dateStr}</span>
              {post.location && (
                <>
                  <span className="text-zinc-200">·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin size={9} /> {post.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Context menu trigger */}
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
                    <Trash size={13} />
                    删除手记
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post title */}
      {post.title && (
        <h2 className="px-5 py-1 text-[16px] font-bold leading-snug text-zinc-900">
          {post.title}
        </h2>
      )}

      {/* Content blocks */}
      <div className="pb-2">
        {blocks.map((block, i) => {
          if (i === 0 && hasHeroPhoto) return null;
          return (
            <BlockContent
              key={block.id}
              block={block}
              isFirst={i === 0}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          );
        })}
      </div>

      {/* Append section */}
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
        <AppendEditor postId={post.id} onClose={() => setAppendOpen(false)} />
      )}
    </article>
  );
}
