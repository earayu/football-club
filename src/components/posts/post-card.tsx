"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PostPhotoGrid, type GridPhoto } from "./post-photo-grid";
import { VideoEmbed } from "./video-embed";
import { deletePost, togglePinPost, deleteBlock, appendTextBlock, appendPhotosBlock, appendVideoBlock } from "@/lib/actions/posts";
import {
  MapPin, PushPin, Trash, Plus, X, TextT,
  Image as ImageIcon, YoutubeLogo, CheckCircle,
  DotsThree,
} from "@phosphor-icons/react";

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

function Avatar({ url, name, size = "md" }: { url: string | null; name: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-sm";
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

// ─── Append Block Editor (inline) ─────────────────────────────────────────────

function AppendBlockEditor({ postId, onClose }: { postId: string; onClose: () => void }) {
  const router = useRouter();
  const [blockType, setBlockType] = useState<"text" | "photos" | "video" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // text state
  const [textContent, setTextContent] = useState("");
  // photos state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // video state
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");

  async function handleSubmit() {
    if (!blockType) return;
    setSaving(true);
    setError(null);
    try {
      if (blockType === "text" && textContent.trim()) {
        const res = await appendTextBlock(postId, textContent.trim()) as any;
        if (res?.error) { setError(res.error); setSaving(false); return; }
      } else if (blockType === "photos" && photoFiles.length > 0) {
        const fd = new FormData();
        photoFiles.forEach(f => fd.append("photos", f));
        const res = await appendPhotosBlock(postId, fd) as any;
        if (res?.error) { setError(res.error); setSaving(false); return; }
      } else if (blockType === "video" && videoUrl.trim()) {
        const res = await appendVideoBlock(postId, videoUrl.trim(), videoCaption || undefined) as any;
        if (res?.error) { setError(res.error); setSaving(false); return; }
      }
      router.refresh();
      onClose();
    } catch {
      setError("提交失败，请重试");
      setSaving(false);
    }
  }

  function handlePhotoFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    setPhotoFiles(p => [...p, ...arr]);
    setPhotoPreviews(p => [...p, ...arr.map(f => URL.createObjectURL(f))]);
  }

  const videoEmbedUrl = videoUrl ? getVideoEmbed(videoUrl) : null;
  const isValidVideo = !!videoEmbedUrl;

  if (!blockType) {
    return (
      <div className="px-5 pb-4 pt-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">添加内容块</p>
        <div className="flex gap-2">
          {[
            { type: "text" as const, Icon: TextT, label: "文字" },
            { type: "photos" as const, Icon: ImageIcon, label: "照片" },
            { type: "video" as const, Icon: YoutubeLogo, label: "视频" },
          ].map(({ type, Icon, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => setBlockType(type)}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-zinc-50 py-3 text-zinc-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
            >
              <Icon size={18} weight="duotone" />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-xs text-zinc-400 transition hover:text-zinc-600"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 px-5 pt-3 pb-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          {blockType === "text" ? "添加文字" : blockType === "photos" ? "添加照片" : "添加视频"}
        </span>
        <button type="button" onClick={onClose} className="rounded-full p-0.5 text-zinc-400 hover:text-zinc-600">
          <X size={13} weight="bold" />
        </button>
      </div>

      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {blockType === "text" && (
        <textarea
          autoFocus
          value={textContent}
          onChange={e => setTextContent(e.target.value)}
          placeholder="写点什么..."
          className="min-h-[80px] w-full resize-none rounded-xl border border-slate-200 bg-zinc-50/60 px-3.5 py-2.5 text-[14px] leading-relaxed text-zinc-800 placeholder:text-zinc-300 focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100"
        />
      )}

      {blockType === "photos" && (
        <div className="space-y-2">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handlePhotoFiles(e.dataTransfer.files); }}
            onClick={() => photoInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed py-5 transition ${dragging ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-green-300 hover:bg-green-50/30"}`}
          >
            <ImageIcon size={20} weight="duotone" className={dragging ? "text-green-500" : "text-zinc-300"} />
            <p className="text-xs font-medium text-zinc-400">
              {photoFiles.length > 0 ? "继续添加照片" : "拖放或点击上传"}
            </p>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handlePhotoFiles(e.target.files)} />
          </div>
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-5 gap-1">
              {photoPreviews.map((url, i) => (
                <div key={i} className="group/p relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFiles(p => p.filter((_, j) => j !== i)); setPhotoPreviews(p => p.filter((_, j) => j !== i)); }}
                    className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white group-hover/p:flex hover:bg-red-500"
                  >
                    <X size={9} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {blockType === "video" && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition ${isValidVideo ? "border-green-200 bg-green-50/40" : "border-slate-200 bg-zinc-50"}`}>
            <YoutubeLogo size={15} weight="duotone" className={isValidVideo ? "text-green-600 shrink-0" : "text-zinc-300 shrink-0"} />
            <input
              autoFocus
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="粘贴 YouTube 或 Bilibili 链接..."
              className="flex-1 bg-transparent text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
            />
            {isValidVideo && <CheckCircle size={14} className="shrink-0 text-green-600" weight="fill" />}
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
              placeholder="字幕（可选）"
              className="w-full bg-transparent text-xs text-zinc-500 placeholder:text-zinc-300 focus:outline-none"
            />
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100"
        >
          取消
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || (blockType === "text" && !textContent.trim()) || (blockType === "photos" && photoFiles.length === 0) || (blockType === "video" && !videoUrl.trim())}
          className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-green-900/20 transition hover:bg-green-800 active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : null}
          发布
        </button>
      </div>
    </div>
  );
}

// ─── Block Content ─────────────────────────────────────────────────────────────

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
        <div className="flex items-center gap-2 border-t border-slate-50 px-5 py-2.5">
          <Avatar url={block.profiles.avatar_url} name={block.profiles.display_name} size="sm" />
          <span className="text-xs text-zinc-400">
            <span className="font-medium text-zinc-600">{block.profiles.display_name}</span>
            {" "}补充了 {block.type === "text" ? "文字" : block.type === "photos" ? `${photos.length} 张照片` : "视频"}
          </span>
          {canDelete && (
            <button
              onClick={async () => { if (!confirm("删除该内容块？")) return; await deleteBlock(block.id); router.refresh(); }}
              className="ml-auto text-xs text-zinc-300 transition hover:text-red-400"
            >
              删除
            </button>
          )}
        </div>
      )}
      {block.type === "text" && block.post_block_items[0]?.body && (
        <p className="px-5 py-2 text-[15px] leading-[1.8] text-zinc-700 whitespace-pre-wrap">
          {block.post_block_items[0].body}
        </p>
      )}
      {block.type === "photos" && photos.length > 0 && <PostPhotoGrid photos={photos} />}
      {block.type === "video" && block.post_block_items[0]?.video_url && (
        <div className="px-5 py-2">
          <VideoEmbed url={block.post_block_items[0].video_url} caption={block.post_block_items[0].video_caption} />
        </div>
      )}
    </div>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

export function PostCard({ post, currentUserId, isAdmin, clubSlug: _clubSlug }: {
  post: PostData; currentUserId: string | null; isAdmin: boolean; clubSlug: string;
}) {
  const router = useRouter();
  const [appendOpen, setAppendOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const canDelete = isAdmin || post.created_by === currentUserId;
  const blocks = [...post.post_blocks].sort((a, b) => a.sort_order - b.sort_order);
  const firstBlock = blocks[0];
  const hasHeroPhoto = firstBlock?.type === "photos";
  const heroPhotos: GridPhoto[] = hasHeroPhoto
    ? firstBlock.post_block_items.filter(i => i.url).sort((a, b) => a.sort_order - b.sort_order).map(i => ({ id: i.id, url: i.url! }))
    : [];

  const date = new Date(post.event_date);
  const dateStr = date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });

  return (
    <article className={`overflow-hidden rounded-2xl bg-white transition-shadow hover:shadow-[0_8px_28px_-4px_rgba(0,0,0,0.1)] ${post.is_pinned ? "shadow-[0_2px_12px_-2px_rgba(217,119,6,0.12)] ring-1 ring-amber-300/40" : "shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_-4px_rgba(0,0,0,0.06)] border border-slate-200/60"}`}>

      {/* Hero photo — full bleed */}
      {hasHeroPhoto && heroPhotos.length > 0 && <PostPhotoGrid photos={heroPhotos} />}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <div className="flex items-center gap-3">
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} />
          <div>
            <div className="flex items-center gap-2 leading-tight">
              <span className="text-[13px] font-semibold text-zinc-900">{post.profiles.display_name}</span>
              {post.is_pinned && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                  <PushPin size={8} weight="fill" /> 置顶
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
              <span>{dateStr}</span>
              {post.location && (
                <>
                  <span className="text-zinc-200">·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin size={10} /> {post.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Context menu */}
        {(isAdmin || canDelete) && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-100 hover:text-zinc-500"
            >
              <DotsThree size={18} weight="bold" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-slate-200/70 bg-white py-1 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12)]"
                onMouseLeave={() => setMenuOpen(false)}
              >
                {isAdmin && (
                  <button
                    onClick={async () => { setMenuOpen(false); await togglePinPost(post.id, !post.is_pinned); router.refresh(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <PushPin size={14} weight={post.is_pinned ? "fill" : "regular"} className={post.is_pinned ? "text-amber-400" : "text-zinc-400"} />
                    {post.is_pinned ? "取消置顶" : "置顶"}
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={async () => { setMenuOpen(false); if (!confirm("删除该手记？")) return; await deletePost(post.id); router.refresh(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <Trash size={14} />
                    删除手记
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="px-5 pt-1 pb-1 text-[16px] font-bold leading-snug text-zinc-900">{post.title}</h2>
      )}

      {/* Blocks */}
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
        <div className="border-t border-slate-50 px-5 py-2.5">
          <button
            type="button"
            onClick={() => setAppendOpen(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 transition hover:text-green-700"
          >
            <Plus size={13} weight="bold" /> 补充内容
          </button>
        </div>
      )}

      {currentUserId && appendOpen && (
        <AppendBlockEditor postId={post.id} onClose={() => setAppendOpen(false)} />
      )}
    </article>
  );
}
