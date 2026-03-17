import { describe, expect, it } from "vitest";
import {
  validateCreatePostPayload,
  validateEntryPayload,
} from "@/lib/actions/post-payloads";
import type { PostEntryDocument } from "@/lib/posts/document";

const validDocument: PostEntryDocument = [
  {
    id: "paragraph-1",
    type: "paragraph",
    props: {
      backgroundColor: "default",
      textColor: "default",
      textAlignment: "left",
    },
    content: [
      {
        type: "text",
        text: "今天训练顺利",
        styles: {},
      },
    ],
    children: [],
  },
];

describe("validateEntryPayload", () => {
  it("rejects empty documents", () => {
    expect(() => validateEntryPayload([])).toThrow(/内容不能为空/);
  });

  it("returns valid documents unchanged", () => {
    expect(validateEntryPayload(validDocument)).toEqual(validDocument);
  });
});

describe("validateCreatePostPayload", () => {
  it("trims optional string fields", () => {
    expect(
      validateCreatePostPayload({
        title: "  周末训练  ",
        location: "  人民体育场  ",
        eventDate: "2026-03-17T10:00:00.000Z",
        content: validDocument,
      })
    ).toMatchObject({
      title: "周末训练",
      location: "人民体育场",
    });
  });

  it("normalizes blank optional fields to null", () => {
    expect(
      validateCreatePostPayload({
        title: "   ",
        location: "",
        eventDate: "2026-03-17T10:00:00.000Z",
        content: validDocument,
      })
    ).toMatchObject({
      title: null,
      location: null,
    });
  });
});
