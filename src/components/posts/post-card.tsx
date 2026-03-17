"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostPhotoGrid, type GridPhoto } from "./post-photo-grid";
import { VideoEmbed } from "./video-embed";
import { deletePost, togglePinPost, deleteBlock } from "@/lib/actions/posts";
import { MapPin, PushPin, Trash, Plus } from "@phosphor-icons/react";

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
  const cls = size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-sm";
  if (url) return <img src={url} alt={name} className={`${cls} shrink-0 rounded-full object-cover`} />;
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-green-700 font-bold text-white`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

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
        <div className="flex items-center gap-2 border-t border-slate-50 px-5 py-2">
          <Avatar url={block.profiles.avatar_url} name={block.profiles.display_name} size="sm" />
          <span className="text-xs text-zinc-400">
            <span className="font-medium text-zinc-600">{block.profiles.display_name}</span>
            {" "}added {block.type === "text" ? "text" : block.type === "photos" ? `${photos.length} photos` : "a video"}
          </span>
          {canDelete && (
            <button onClick={async () => { if (!confirm("Delete this block?")) return; await deleteBlock(block.id); router.refresh(); }}
              className="ml-auto text-xs text-zinc-300 transition hover:text-red-400">
              Delete
            </button>
          )}
        </div>
      )}
      {block.type === "text" && block.post_block_items[0]?.body && (
        <p className="px-5 py-1.5 text-[15px] leading-[1.75] text-zinc-700 whitespace-pre-wrap">
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

export function PostCard({ post, currentUserId, isAdmin, clubSlug }: {
  post: PostData; currentUserId: string | null; isAdmin: boolean; clubSlug: string;
}) {
  const router = useRouter();
  const canDelete = isAdmin || post.created_by === currentUserId;
  const blocks = [...post.post_blocks].sort((a, b) => a.sort_order - b.sort_order);
  const firstBlock = blocks[0];
  const hasHeroPhoto = firstBlock?.type === "photos";
  const heroPhotos: GridPhoto[] = hasHeroPhoto
    ? firstBlock.post_block_items.filter(i => i.url).sort((a, b) => a.sort_order - b.sort_order).map(i => ({ id: i.id, url: i.url! }))
    : [];

  const date = new Date(post.event_date);
  const dateStr = date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });

  return (
    <article className={`overflow-hidden rounded-2xl bg-white shadow-card transition hover:shadow-[0_8px_28px_-4px_rgba(0,0,0,0.1)] ${post.is_pinned ? "ring-1 ring-amber-300/50" : "border border-slate-200/60"}`}>

      {/* Hero photo */}
      {hasHeroPhoto && heroPhotos.length > 0 && <PostPhotoGrid photos={heroPhotos} />}

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900">{post.profiles.display_name}</span>
              {post.is_pinned && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                  <PushPin size={9} weight="fill" /> Pinned
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-400">
              <span>{dateStr}</span>
              {post.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin size={10} /> {post.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {isAdmin && (
            <button
              onClick={async () => { await togglePinPost(post.id, !post.is_pinned); router.refresh(); }}
              title={post.is_pinned ? "Unpin" : "Pin"}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition ${post.is_pinned ? "text-amber-400 hover:text-amber-500" : "text-zinc-200 hover:text-amber-400"} hover:bg-zinc-100`}
            >
              <PushPin size={14} weight={post.is_pinned ? "fill" : "regular"} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={async () => { if (!confirm("Delete this post?")) return; await deletePost(post.id); router.refresh(); }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-200 transition hover:bg-red-50 hover:text-red-400"
            >
              <Trash size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="px-5 pb-2 text-[17px] font-bold leading-snug text-zinc-900">{post.title}</h2>
      )}

      {/* Blocks */}
      <div className="pb-2">
        {blocks.map((block, i) => {
          if (i === 0 && hasHeroPhoto) return null;
          return <BlockContent key={block.id} block={block} isFirst={i === 0}
            currentUserId={currentUserId} isAdmin={isAdmin} />;
        })}
      </div>

      {/* Append */}
      {currentUserId && (
        <div className="border-t border-slate-50 px-5 py-2.5">
          <button className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-green-700">
            <Plus size={13} weight="bold" /> Add content
          </button>
        </div>
      )}
    </article>
  );
}
