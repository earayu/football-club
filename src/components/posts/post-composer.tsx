"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import {
  ArrowUp,
  Image as ImageIcon,
  Link as LinkIcon,
  SpinnerGap,
  X,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { appendPostEntry, createRichPost } from "@/lib/actions/rich-posts";
import { resolveDroppedUrl } from "@/lib/actions/url-preview";
import { uploadMediaFileToStorage } from "@/lib/upload";
import { classifyExternalUrl, hasMeaningfulContent, type PostEntryDocument } from "@/lib/posts/document";
import {
  createLinkPreviewBlockData,
  normalizeInitialDocument,
  postEditorSchema,
} from "@/components/posts/editor/post-editor-schema";

type PostComposerProps = {
  mode: "create" | "append";
  clubId: string;
  postId?: string;
  userAvatarUrl?: string | null;
  userInitial?: string;
  initialOpen?: boolean;
  onClose?: () => void;
};

function Avatar({
  url,
  initial,
  size = "md",
}: {
  url?: string | null;
  initial: string;
  size?: "sm" | "md";
}) {
  const classes = size === "sm" ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-[13px]";

  if (url) {
    return <img src={url} alt="" className={`${classes} shrink-0 rounded-full object-cover`} />;
  }

  return (
    <div className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-green-700 font-bold text-white`}>
      {initial}
    </div>
  );
}

function ComposerLoadingShell({
  mode,
  userAvatarUrl,
  userInitial,
  initialOpen,
}: Pick<PostComposerProps, "mode" | "userAvatarUrl" | "userInitial" | "initialOpen">) {
  if (mode === "create" && !initialOpen) {
    return (
      <div className="group flex w-full items-center gap-4 rounded-[1.75rem] border border-[rgba(0,0,0,0.06)] bg-white/92 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_18px_50px_-32px_rgba(0,0,0,0.14)]">
        <Avatar url={userAvatarUrl} initial={userInitial ?? "?"} />
        <span className="flex-1 text-left text-[15px] font-medium text-zinc-400">
          今天发生了什么？
        </span>
        <div className="flex items-center gap-2 text-zinc-300">
          <ImageIcon size={15} weight="duotone" />
          <YoutubeLogo size={15} weight="duotone" />
          <LinkIcon size={15} weight="duotone" />
        </div>
      </div>
    );
  }

  return (
    <div className="editor-surface overflow-hidden rounded-[2rem]">
      <div className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.05)] px-6 py-4 sm:px-7">
        <Avatar url={userAvatarUrl} initial={userInitial ?? "?"} size="sm" />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-zinc-100" />
          <div className="h-2.5 w-44 rounded-full bg-zinc-50" />
        </div>
      </div>
      <div className="px-6 py-6 sm:px-7">
        <div className="h-[24rem] rounded-[1.65rem] bg-zinc-50/80" />
      </div>
    </div>
  );
}

function PostComposerInner({
  mode,
  clubId,
  postId,
  userAvatarUrl,
  userInitial = "?",
  initialOpen = false,
  onClose,
}: PostComposerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(mode === "append" ? true : initialOpen);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [resolvingCount, setResolvingCount] = useState(0);

  const emptyDocument = useMemo(() => normalizeInitialDocument([]), []);
  const draftSessionId = useMemo(() => crypto.randomUUID(), []);

  const editor = useCreateBlockNote(
    {
      schema: postEditorSchema,
      initialContent: emptyDocument,
      uploadFile: async (file) => {
        setUploadingCount((count) => count + 1);

        try {
          const result = await uploadMediaFileToStorage(
            file,
            `posts/${clubId}/drafts/${draftSessionId}`
          );

          if (result.error || !result.url) {
            throw new Error(result.error ?? "上传失败");
          }

          return result.url;
        } finally {
          setUploadingCount((count) => Math.max(0, count - 1));
        }
      },
      pasteHandler: ({ event, editor, defaultPasteHandler }) => {
        const pasted = event.clipboardData?.getData("text/plain")?.trim();
        if (!pasted) {
          return defaultPasteHandler({ plainTextAsMarkdown: false });
        }

        if (!classifyExternalUrl(pasted)) {
          return defaultPasteHandler({ plainTextAsMarkdown: false });
        }

        event.preventDefault();
        void insertExternalUrl(editor, pasted);
        return true;
      },
    },
    [clubId, draftSessionId]
  );

  async function insertExternalUrl(
    editorInstance: typeof editor,
    rawUrl: string
  ) {
    const match = classifyExternalUrl(rawUrl);
    if (!match) return;

    const currentBlock = editorInstance.getTextCursorPosition().block;
    const shouldReplaceCurrentBlock =
      currentBlock.type === "paragraph" &&
      !hasMeaningfulContent([currentBlock as unknown as PostEntryDocument[number]]);

    const insertBlocks = (blocks: Parameters<typeof editorInstance.insertBlocks>[0]) => {
      if (shouldReplaceCurrentBlock) {
        return editorInstance.replaceBlocks([currentBlock], blocks).insertedBlocks;
      }

      return editorInstance.insertBlocks(blocks, currentBlock, "after");
    };

    if (match.kind === "image") {
      insertBlocks([{ type: "image", props: { url: match.url } }]);
      return;
    }

    if (match.kind === "video") {
      insertBlocks([{ type: "video", props: { url: match.url } }]);
      return;
    }

    const insertedBlocks = insertBlocks([
      createLinkPreviewBlockData({
        url: match.url,
        status: "loading",
      }),
    ]);

    const targetBlock = insertedBlocks[0];
    if (!targetBlock) return;

    setResolvingCount((count) => count + 1);

    try {
      const result = await resolveDroppedUrl(match.url);

      if ("error" in result && result.error) {
        editorInstance.updateBlock(targetBlock, {
          props: { status: "error" },
        });
        return;
      }

      if (result.kind === "link") {
        editorInstance.updateBlock(targetBlock, {
          props: {
            url: result.preview.url,
            title: result.preview.title,
            description: result.preview.description,
            image: result.preview.image,
            siteName: result.preview.siteName,
            status: "ready",
          },
        });
      }
    } catch {
      editorInstance.updateBlock(targetBlock, {
        props: { status: "error" },
      });
    } finally {
      setResolvingCount((count) => Math.max(0, count - 1));
    }
  }

  function resetComposer() {
    editor.replaceBlocks(editor.document, normalizeInitialDocument([]));
    setTitle("");
    setLocation("");
    setEventDate(new Date().toISOString().slice(0, 16));
    setError(null);
    setHasContent(false);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const content = editor.document as PostEntryDocument;

    const result =
      mode === "create"
        ? await createRichPost(clubId, {
            title,
            location,
            eventDate: new Date(eventDate).toISOString(),
            content,
          })
        : await appendPostEntry(postId!, content);

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    resetComposer();
    if (mode === "create") {
      setOpen(false);
    }
    onClose?.();
    router.refresh();
  }

  if (mode === "create" && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-4 rounded-[1.75rem] border border-[rgba(0,0,0,0.06)] bg-white/92 px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_18px_50px_-32px_rgba(0,0,0,0.14)] transition-all duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-green-200/70 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_20px_60px_-28px_rgba(0,0,0,0.14)]"
      >
        <Avatar url={userAvatarUrl} initial={userInitial} />
        <span className="flex-1 text-left text-[15px] font-medium text-zinc-400 group-hover:text-zinc-500 transition-colors duration-200">
          今天发生了什么？
        </span>
        <div className="flex items-center gap-2 text-zinc-300 transition-colors duration-200 group-hover:text-zinc-400">
          <ImageIcon size={15} weight="duotone" />
          <YoutubeLogo size={15} weight="duotone" />
          <LinkIcon size={15} weight="duotone" />
        </div>
      </button>
    );
  }

  return (
    <div className="editor-surface animate-scale-in overflow-hidden rounded-[2rem]">
      <div className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.05)] px-6 py-4 sm:px-7">
        <Avatar url={userAvatarUrl} initial={userInitial} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-zinc-900">
            {mode === "create" ? "发布手记" : "补充内容"}
          </p>
          <p className="text-[11px] text-zinc-400">
            支持拖入图片/视频、粘贴截图，以及粘贴图片/视频/网页链接
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetComposer();
            if (mode === "create") {
              setOpen(false);
            }
            onClose?.();
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <X size={12} weight="bold" />
        </button>
      </div>

      <div className="space-y-4 px-6 py-5 sm:px-7 sm:py-6">
        {mode === "create" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="标题（可选）"
              className="rounded-[1.15rem] border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 shadow-[0_14px_35px_-28px_rgba(15,23,42,0.24)] focus:border-green-400 focus:outline-none"
            />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="地点（可选）"
              className="rounded-[1.15rem] border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 shadow-[0_14px_35px_-28px_rgba(15,23,42,0.24)] focus:border-green-400 focus:outline-none"
            />
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="rounded-[1.15rem] border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-800 shadow-[0_14px_35px_-28px_rgba(15,23,42,0.24)] focus:border-green-400 focus:outline-none sm:col-span-2"
            />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl bg-red-50 px-4 py-2.5 text-[12px] leading-relaxed text-red-600">
            {error}
          </div>
        ) : null}

        <div
          onDropCapture={(event) => {
            if (event.dataTransfer.files.length > 0) return;

            const dropped =
              event.dataTransfer.getData("text/uri-list")?.split("\n")[0]?.trim() ||
              event.dataTransfer.getData("text/plain")?.trim() ||
              "";

            if (!dropped || !classifyExternalUrl(dropped)) return;

            event.preventDefault();
            event.stopPropagation();
            void insertExternalUrl(editor, dropped);
          }}
          className="rounded-[1.65rem] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,249,0.92))] shadow-[0_30px_80px_-52px_rgba(15,23,42,0.26)]"
        >
          <BlockNoteView
            editor={editor}
            slashMenu
            sideMenu
            formattingToolbar
            filePanel
            onChange={(currentEditor) => {
              setHasContent(hasMeaningfulContent(currentEditor.document as PostEntryDocument));
            }}
            className={`post-composer-view ${mode === "create" ? "min-h-[26rem]" : "min-h-[20rem]"}`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[rgba(0,0,0,0.05)] px-6 py-4 sm:px-7">
        {uploadingCount > 0 || resolvingCount > 0 ? (
          <span className="text-[11px] text-zinc-400">
            {uploadingCount > 0 ? `上传中 ${uploadingCount}` : `解析链接中 ${resolvingCount}`}
          </span>
        ) : (
          <span className="text-[11px] text-zinc-400">
            直接拖入媒体或粘贴链接即可自动识别
          </span>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasContent || saving || uploadingCount > 0 || resolvingCount > 0}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white shadow-[0_2px_8px_rgba(21,128,61,0.3)] transition-all duration-200 hover:bg-green-800 disabled:opacity-40"
        >
          {saving ? (
            <SpinnerGap size={14} className="animate-spin" />
          ) : (
            <ArrowUp size={14} weight="bold" />
          )}
        </button>
      </div>
    </div>
  );
}

export function PostComposer(props: PostComposerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ComposerLoadingShell
        mode={props.mode}
        userAvatarUrl={props.userAvatarUrl}
        userInitial={props.userInitial}
        initialOpen={props.initialOpen}
      />
    );
  }

  return <PostComposerInner {...props} />;
}
