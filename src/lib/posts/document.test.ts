import { describe, expect, it } from "vitest";
import {
  classifyExternalUrl,
  hasMeaningfulContent,
  summarizeEntryContent,
  type PostEntryDocument,
} from "@/lib/posts/document";

function makeParagraph(text: string) {
  return {
    id: crypto.randomUUID(),
    type: "paragraph",
    props: {},
    content: [
      {
        type: "text" as const,
        text,
        styles: {},
      },
    ],
    children: [],
  };
}

function makeImage(url: string) {
  return {
    id: crypto.randomUUID(),
    type: "image",
    props: {
      url,
    },
    content: undefined,
    children: [],
  };
}

function makeVideo(url: string) {
  return {
    id: crypto.randomUUID(),
    type: "video",
    props: {
      url,
    },
    content: undefined,
    children: [],
  };
}

function makeLink(url: string) {
  return {
    id: crypto.randomUUID(),
    type: "linkPreview",
    props: {
      url,
    },
    content: undefined,
    children: [],
  };
}

describe("classifyExternalUrl", () => {
  it("classifies image urls", () => {
    expect(classifyExternalUrl("https://cdn.example.com/cover.jpg")).toMatchObject({
      kind: "image",
    });
  });

  it("classifies supported embed urls as videos", () => {
    expect(classifyExternalUrl("https://youtu.be/abcdefghijk")).toMatchObject({
      kind: "video",
      provider: "youtube",
    });
  });

  it("classifies direct video file urls as videos", () => {
    expect(classifyExternalUrl("https://cdn.example.com/highlights.mp4")).toMatchObject({
      kind: "video",
      provider: "file",
    });
  });

  it("classifies normal webpages as links", () => {
    expect(classifyExternalUrl("https://club.example.com/posts/1")).toMatchObject({
      kind: "link",
    });
  });

  it("rejects unsupported protocols", () => {
    expect(classifyExternalUrl("ftp://club.example.com/file.jpg")).toBeNull();
  });
});

describe("hasMeaningfulContent", () => {
  it("treats whitespace-only paragraphs as empty", () => {
    const document = [makeParagraph("   ")] as PostEntryDocument;

    expect(hasMeaningfulContent(document)).toBe(false);
  });

  it("treats media blocks as meaningful content", () => {
    const document = [makeImage("https://cdn.example.com/training.jpg")] as PostEntryDocument;

    expect(hasMeaningfulContent(document)).toBe(true);
  });
});

describe("summarizeEntryContent", () => {
  it("summarizes photo-only entries", () => {
    const document = [
      makeImage("https://cdn.example.com/1.jpg"),
      makeImage("https://cdn.example.com/2.jpg"),
    ] as PostEntryDocument;

    expect(summarizeEntryContent(document)).toBe("补充了 2 张照片");
  });

  it("summarizes mixed entries in a readable order", () => {
    const document = [
      makeParagraph("今天训练状态很好"),
      makeImage("https://cdn.example.com/1.jpg"),
      makeImage("https://cdn.example.com/2.jpg"),
      makeVideo("https://youtu.be/abcdefghijk"),
      makeLink("https://club.example.com/report"),
    ] as PostEntryDocument;

    expect(summarizeEntryContent(document)).toBe("补充了文字、2 张照片、1 个视频、1 个链接");
  });
});
