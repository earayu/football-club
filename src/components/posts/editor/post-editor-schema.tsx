"use client";

import { BlockNoteSchema, defaultBlockSpecs, defaultProps } from "@blocknote/core";
import { BlockContentWrapper, createReactBlockSpec } from "@blocknote/react";
import type { PostEntryDocument } from "@/lib/posts/document";

export type LinkPreviewStatus = "loading" | "ready" | "error";

export type LinkPreviewProps = {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
  status: LinkPreviewStatus;
};

const linkPreviewPropSchema = {
  ...defaultProps,
  url: {
    default: "",
  },
  title: {
    default: "",
  },
  description: {
    default: "",
  },
  image: {
    default: "",
  },
  siteName: {
    default: "",
  },
  status: {
    default: "loading",
    values: ["loading", "ready", "error"] as const,
  },
};

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function LinkPreviewCard({
  url,
  title,
  description,
  image,
  siteName,
  status,
}: LinkPreviewProps) {
  const hostname = siteName || getHostname(url);
  const isLoading = status === "loading";
  const isError = status === "error";
  const resolvedTitle = title || (isLoading ? "正在解析链接..." : hostname || url);
  const resolvedDescription =
    description || (isError ? "暂时无法获取链接摘要，仍然可以点击访问原始链接。" : "");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all duration-200 hover:border-green-300 hover:shadow-md"
    >
      {image ? (
        <div className="aspect-[1.8/1] overflow-hidden bg-zinc-100">
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="space-y-1 px-4 py-3">
        <p className="line-clamp-2 text-[14px] font-semibold text-zinc-900">
          {resolvedTitle}
        </p>
        {resolvedDescription ? (
          <p className="line-clamp-2 text-[12px] leading-5 text-zinc-500">
            {resolvedDescription}
          </p>
        ) : null}
        <p className="truncate text-[11px] font-medium text-zinc-400">{hostname}</p>
      </div>
    </a>
  );
}

const createLinkPreviewBlock = createReactBlockSpec(
  {
    type: "linkPreview",
    propSchema: linkPreviewPropSchema,
    content: "none",
  },
  {
    render: ({ block }) => (
      <BlockContentWrapper
        blockType={block.type}
        blockProps={block.props}
        propSchema={linkPreviewPropSchema}
      >
        <LinkPreviewCard
          url={block.props.url}
          title={block.props.title}
          description={block.props.description}
          image={block.props.image}
          siteName={block.props.siteName}
          status={block.props.status}
        />
      </BlockContentWrapper>
    ),
  }
);

export const postEditorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    linkPreview: createLinkPreviewBlock(),
  },
});

export function createLinkPreviewBlockData(
  props: Partial<LinkPreviewProps> & Pick<LinkPreviewProps, "url">
) {
  return {
    type: "linkPreview" as const,
    props: {
      url: props.url,
      title: props.title ?? "",
      description: props.description ?? "",
      image: props.image ?? "",
      siteName: props.siteName ?? getHostname(props.url),
      status: props.status ?? "loading",
    },
  };
}

export function normalizeInitialDocument(document: PostEntryDocument): PostEntryDocument {
  return document.length > 0
    ? document
    : [
        {
          id: crypto.randomUUID(),
          type: "paragraph",
          props: {
            backgroundColor: "default",
            textColor: "default",
            textAlignment: "left",
          },
          content: [],
          children: [],
        },
      ];
}
