"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DotsThree,
  MapPin,
  Plus,
  PushPin,
  Trash,
} from "@phosphor-icons/react";
import { deletePost, deletePostEntry, togglePinPost } from "@/lib/actions/rich-posts";
import { summarizeEntryContent, type PostEntryDocument } from "@/lib/posts/document";
import { PostComposer } from "@/components/posts/post-composer";
import { RichContentView } from "@/components/posts/rich-content-view";

export type PostEntryData = {
  id: string;
  post_id: string;
  author_id: string;
  sort_order: number;
  created_at: string;
  content: PostEntryDocument;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
};

export type PostData = {
  id: string;
  title: string | null;
  location: string | null;
  event_date: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
  post_entries: PostEntryData[];
};

function Avatar({
  url,
  name,
  size = "md",
}: {
  url: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const classes = size === "sm" ? "h-5 w-5 text-[9px]" : "h-8 w-8 text-[13px]";

  if (url) {
    return <img src={url} alt={name} className={`${classes} shrink-0 rounded-full object-cover`} />;
  }

  return (
    <div className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-green-700 font-bold text-white`}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function PostEntrySection({
  entry,
  isFirst,
  currentUserId,
  isAdmin,
}: {
  entry: PostEntryData;
  isFirst: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const canDeleteEntry = !isFirst && (isAdmin || entry.author_id === currentUserId);

  return (
    <section>
      {!isFirst && (
        <div className="flex items-center gap-2 px-5 py-2 border-t border-[rgba(0,0,0,0.04)]">
          <Avatar
            url={entry.profiles.avatar_url}
            name={entry.profiles.display_name}
            size="sm"
          />
          <span className="text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-600">{entry.profiles.display_name}</span>
            {" "}
            {summarizeEntryContent(entry.content)}
          </span>
          {canDeleteEntry ? (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("删除这条补充内容？")) return;
                await deletePostEntry(entry.id);
                router.refresh();
              }}
              className="ml-auto text-[11px] text-zinc-300 transition-colors hover:text-red-400"
            >
              删除
            </button>
          ) : null}
        </div>
      )}
      <div className={isFirst ? "px-5 pb-4" : "px-5 py-3"}>
        <RichContentView document={entry.content} />
      </div>
    </section>
  );
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  clubId,
  currentUserAvatarUrl,
  currentUserInitial,
}: {
  post: PostData;
  currentUserId: string | null;
  isAdmin: boolean;
  clubId: string;
  currentUserAvatarUrl?: string | null;
  currentUserInitial: string;
}) {
  const router = useRouter();
  const [appendOpen, setAppendOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const close = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const canDeletePost = isAdmin || post.created_by === currentUserId;
  const hasMenu = isAdmin || canDeletePost;
  const entries = [...post.post_entries].sort((a, b) => a.sort_order - b.sort_order);
  const dateStr = new Date(post.event_date).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
  });

  return (
    <article
      className={`overflow-hidden rounded-[1.25rem] bg-white transition-all duration-[350ms] ${
        post.is_pinned
          ? "shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.08)] ring-1 ring-amber-300/30"
          : "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_20px_-6px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05),0_16px_40px_-8px_rgba(0,0,0,0.12)]"
      }`}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-1.5">
        <div className="flex items-center gap-2.5">
          <Avatar url={post.profiles.avatar_url} name={post.profiles.display_name} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold leading-tight text-zinc-900">
                {post.profiles.display_name}
              </span>
              {post.is_pinned ? (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold leading-none text-amber-600">
                  <PushPin size={8} weight="fill" /> 置顶
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span>{dateStr}</span>
              {post.location ? (
                <>
                  <span className="text-zinc-200">·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin size={9} /> {post.location}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {hasMenu ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-500"
            >
              <DotsThree size={18} weight="bold" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1.5 animate-scale-in min-w-[140px] overflow-hidden rounded-xl border border-[rgba(0,0,0,0.07)] bg-white py-1 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.14)]">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      await togglePinPost(post.id, !post.is_pinned);
                      router.refresh();
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    <PushPin
                      size={13}
                      weight={post.is_pinned ? "fill" : "regular"}
                      className={post.is_pinned ? "text-amber-400" : "text-zinc-400"}
                    />
                    {post.is_pinned ? "取消置顶" : "置顶手记"}
                  </button>
                ) : null}
                {canDeletePost ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      if (!confirm("确认删除这条手记？")) return;
                      await deletePost(post.id);
                      router.refresh();
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash size={13} /> 删除手记
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {post.title ? (
        <h2 className="px-5 py-1 text-[16px] font-bold leading-snug text-zinc-900">
          {post.title}
        </h2>
      ) : null}

      <div>
        {entries.map((entry, index) => (
          <PostEntrySection
            key={entry.id}
            entry={entry}
            isFirst={index === 0}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {currentUserId && !appendOpen ? (
        <div className="border-t border-[rgba(0,0,0,0.04)] px-5 py-2.5">
          <button
            type="button"
            onClick={() => setAppendOpen(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-zinc-400 transition-all duration-200 hover:text-green-700"
          >
            <Plus size={13} weight="bold" /> 补充内容
          </button>
        </div>
      ) : null}

      {currentUserId && appendOpen ? (
        <div className="border-t border-[rgba(0,0,0,0.04)] px-5 py-3">
          <PostComposer
            mode="append"
            clubId={clubId}
            postId={post.id}
            userAvatarUrl={currentUserAvatarUrl}
            userInitial={currentUserInitial}
            onClose={() => setAppendOpen(false)}
          />
        </div>
      ) : null}
    </article>
  );
}
