"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
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

function Avatar({
  url,
  name,
  size = "sm",
}: {
  url: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-10 w-10 text-sm";
  if (url) {
    return (
      <img src={url} alt={name} className={`${dim} rounded-full object-cover ring-1 ring-white/80`} />
    );
  }
  return (
    <div className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 font-bold text-white`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function PinButton({ postId, isPinned }: { postId: string; isPinned: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async () => { setLoading(true); await togglePinPost(postId, !isPinned); setLoading(false); router.refresh(); }}
      title={isPinned ? "Unpin" : "Pin to top"}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
        isPinned ? "text-yellow-500 hover:text-yellow-600" : "text-gray-300 hover:text-yellow-400"
      } hover:bg-gray-100`}
    >
      <svg className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} viewBox="0 0 20 20" stroke="currentColor" strokeWidth={isPinned ? 0 : 1.5}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  );
}

function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async () => {
        if (!confirm("Delete this post and all its content?")) return;
        setLoading(true);
        await deletePost(postId);
        setLoading(false);
        router.refresh();
      }}
      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition"
      title="Delete post"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

function BlockDeleteButton({ blockId }: { blockId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async (e) => {
        e.stopPropagation();
        setLoading(true);
        await deleteBlock(blockId);
        setLoading(false);
        router.refresh();
      }}
      className="ml-auto shrink-0 text-xs text-gray-300 hover:text-red-400 transition"
    >
      {loading ? "…" : "删除"}
    </button>
  );
}

function BlockItem({
  block,
  currentUserId,
  isAdmin,
  isFirst,
}: {
  block: Block;
  currentUserId: string | null;
  isAdmin: boolean;
  isFirst: boolean;
}) {
  const canDelete = isAdmin || block.author_id === currentUserId;
  const photos: GridPhoto[] = block.post_block_items
    .filter((i) => i.url)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ id: i.id, url: i.url! }));

  const typeLabel =
    block.type === "text"
      ? "追加了文字"
      : block.type === "photos"
      ? `追加了 ${photos.length} 张照片`
      : "追加了视频";

  return (
    <div>
      {/* Block author header (shown when multiple blocks) */}
      {!isFirst && (
        <div className="flex items-center gap-2 border-t border-gray-50 px-5 py-2.5">
          <Avatar url={block.profiles.avatar_url} name={block.profiles.display_name} size="sm" />
          <span className="text-xs text-gray-400">
            <span className="font-medium text-gray-600">{block.profiles.display_name}</span>{" "}
            {typeLabel}
          </span>
          {canDelete && <BlockDeleteButton blockId={block.id} />}
        </div>
      )}

      {/* Block content */}
      {block.type === "text" && (() => {
        const body = block.post_block_items[0]?.body;
        return body ? (
          <p className="px-5 pb-3 text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap">
            {body}
          </p>
        ) : null;
      })()}

      {block.type === "photos" && photos.length > 0 && (
        <div className={isFirst ? "" : ""}>
          <PostPhotoGrid photos={photos} />
        </div>
      )}

      {block.type === "video" && (() => {
        const item = block.post_block_items[0];
        return item?.video_url ? (
          <div className="px-5 pb-3">
            <VideoEmbed url={item.video_url} caption={item.video_caption} />
          </div>
        ) : null;
      })()}
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
  const canDeletePost = isAdmin || post.created_by === currentUserId;
  const sortedBlocks = [...post.post_blocks].sort((a, b) => a.sort_order - b.sort_order);

  // Detect if first block is photos → use as visual hero
  const firstBlock = sortedBlocks[0];
  const hasHeroPhoto = firstBlock?.type === "photos";

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md ${
        post.is_pinned
          ? "border border-green-200 ring-1 ring-green-50"
          : "border border-gray-100"
      }`}
    >
      {/* Pinned banner */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-transparent px-5 py-2 text-xs font-semibold text-green-600">
          <svg className="h-3.5 w-3.5 fill-green-500" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Pinned
        </div>
      )}

      {/* Post header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} size="md" />
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {post.profiles.display_name}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400 mt-0.5">
              <span>{new Date(post.event_date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
              {post.location && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
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
          {canDeletePost && <DeletePostButton postId={post.id} />}
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="px-5 pb-3 text-lg font-bold leading-snug text-gray-900">
          {post.title}
        </h2>
      )}

      {/* Blocks */}
      <div className="pb-1">
        {sortedBlocks.map((block, i) => (
          <BlockItem
            key={block.id}
            block={block}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isFirst={i === 0}
          />
        ))}
      </div>

      {/* Append CTA */}
      {currentUserId && (
        <div className="border-t border-gray-50 px-5 py-3">
          <Link
            href={`/club/${clubSlug}/posts/${post.id}#append`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-green-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            追加内容
          </Link>
        </div>
      )}
    </article>
  );
}
