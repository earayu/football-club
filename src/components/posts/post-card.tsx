"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostPhotoGrid, type GridPhoto } from "./post-photo-grid";
import { VideoEmbed } from "./video-embed";
import { deletePost, togglePinPost, deleteBlock } from "@/lib/actions/posts";

type BlockItem = {
  id: string;
  body: string | null;
  url: string | null;
  video_url: string | null;
  video_caption: string | null;
  sort_order: number;
};

type Block = {
  id: string;
  type: "text" | "photos" | "video";
  author_id: string;
  sort_order: number;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null };
  post_block_items: BlockItem[];
};

export type PostData = {
  id: string;
  title: string | null;
  location: string | null;
  event_date: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null };
  post_blocks: Block[];
};

function Avatar({ url, name, size = "md" }: { url: string | null; name: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-6 w-6 text-[10px]" : "h-10 w-10 text-sm";
  if (url) return <img src={url} alt={name} className={`${cls} shrink-0 rounded-full object-cover`} />;
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 font-bold text-white`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function PinButton({ postId, isPinned }: { postId: string; isPinned: boolean }) {
  const router = useRouter();
  return (
    <button
      onClick={async (e) => { e.stopPropagation(); await togglePinPost(postId, !isPinned); router.refresh(); }}
      title={isPinned ? "取消置顶" : "置顶"}
      className={`flex h-7 w-7 items-center justify-center rounded-full transition ${isPinned ? "text-amber-400 hover:text-amber-500" : "text-gray-300 hover:text-amber-400"} hover:bg-gray-100`}
    >
      <svg className={`h-3.5 w-3.5 ${isPinned ? "fill-current" : ""}`} viewBox="0 0 20 20" strokeWidth={isPinned ? 0 : 1.5} stroke="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  );
}

function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async (e) => { e.stopPropagation(); if (!confirm("删除这条手记？")) return; await deletePost(postId); router.refresh(); }}
      title="删除"
      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

function BlockContent({ block, isFirst }: { block: Block; isFirst: boolean }) {
  const router = useRouter();
  const photos: GridPhoto[] = block.post_block_items
    .filter((i) => i.url)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ id: i.id, url: i.url! }));

  return (
    <div>
      {/* Author attribution (only for appended blocks) */}
      {!isFirst && (
        <div className="flex items-center gap-2 border-t border-gray-50 px-5 py-2">
          <Avatar url={block.profiles.avatar_url} name={block.profiles.display_name} size="sm" />
          <span className="text-xs text-gray-400">
            <span className="font-medium text-gray-500">{block.profiles.display_name}</span>
            {" "}追加了{block.type === "text" ? "文字" : block.type === "photos" ? `${photos.length} 张照片` : "视频"}
          </span>
          <button
            onClick={async () => { if (!confirm("删除此内容块？")) return; await deleteBlock(block.id); router.refresh(); }}
            className="ml-auto text-xs text-gray-300 hover:text-red-400 transition"
          >
            删除
          </button>
        </div>
      )}

      {/* Content */}
      {block.type === "text" && block.post_block_items[0]?.body && (
        <p className="px-5 py-1 text-[15px] leading-[1.7] text-gray-700 whitespace-pre-wrap">
          {block.post_block_items[0].body}
        </p>
      )}
      {block.type === "photos" && photos.length > 0 && (
        <div className="overflow-hidden">
          <PostPhotoGrid photos={photos} />
        </div>
      )}
      {block.type === "video" && block.post_block_items[0]?.video_url && (
        <div className="px-5 py-1">
          <VideoEmbed url={block.post_block_items[0].video_url} caption={block.post_block_items[0].video_caption} />
        </div>
      )}
    </div>
  );
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  clubSlug,
}: {
  post: PostData;
  currentUserId: string | null;
  isAdmin: boolean;
  clubSlug: string;
}) {
  const canDelete = isAdmin || post.created_by === currentUserId;
  const blocks = [...post.post_blocks].sort((a, b) => a.sort_order - b.sort_order);

  // Check if first block is a hero photo
  const firstBlock = blocks[0];
  const hasHeroPhoto = firstBlock?.type === "photos";
  const heroPhotos: GridPhoto[] = hasHeroPhoto
    ? firstBlock.post_block_items
        .filter((i) => i.url)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => ({ id: i.id, url: i.url! }))
    : [];

  const date = new Date(post.event_date);
  const dateStr = date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  const yearStr = date.getFullYear() !== new Date().getFullYear() ? ` ${date.getFullYear()}` : "";

  return (
    <article className={`overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md ${post.is_pinned ? "ring-2 ring-amber-200" : "border border-gray-100"}`}>

      {/* Hero photo (if first block is photos, show above the header) */}
      {hasHeroPhoto && heroPhotos.length > 0 && (
        <div className="overflow-hidden">
          <PostPhotoGrid photos={heroPhotos} />
        </div>
      )}

      {/* Card header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{post.profiles.display_name}</span>
              {post.is_pinned && (
                <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                  <svg className="h-2.5 w-2.5 fill-amber-500" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  置顶
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-gray-400">
              <span>{dateStr}{yearStr}</span>
              {post.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {post.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {isAdmin && <PinButton postId={post.id} isPinned={post.is_pinned} />}
          {canDelete && <DeletePostButton postId={post.id} />}
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="px-5 pb-2 text-[17px] font-bold leading-snug text-gray-900">
          {post.title}
        </h2>
      )}

      {/* Blocks (skip first block if it's the hero photo already rendered above) */}
      <div className="pb-2">
        {blocks.map((block, i) => {
          if (i === 0 && hasHeroPhoto) return null;
          return <BlockContent key={block.id} block={block} isFirst={i === 0} />;
        })}
      </div>

      {/* Append hint */}
      {currentUserId && (
        <div className="border-t border-gray-50 px-5 py-2.5">
          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-green-600 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            追加内容
          </button>
        </div>
      )}
    </article>
  );
}
