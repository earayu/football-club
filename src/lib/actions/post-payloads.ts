import { z } from "zod";
import { hasMeaningfulContent, type PostEntryDocument } from "@/lib/posts/document";

const entryPayloadSchema = z.array(z.any());

const createPostPayloadSchema = z.object({
  title: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  content: entryPayloadSchema,
});

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEventDate(value?: string | null) {
  if (!value?.trim()) return new Date().toISOString();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("活动时间格式不正确");
  }

  return parsed.toISOString();
}

export function validateEntryPayload(input: PostEntryDocument) {
  const document = entryPayloadSchema.parse(input) as PostEntryDocument;

  if (!hasMeaningfulContent(document)) {
    throw new Error("内容不能为空");
  }

  return document;
}

export function validateCreatePostPayload(input: {
  title?: string | null;
  location?: string | null;
  eventDate?: string | null;
  content: PostEntryDocument;
}) {
  const parsed = createPostPayloadSchema.parse(input);

  return {
    title: normalizeOptionalText(parsed.title),
    location: normalizeOptionalText(parsed.location),
    eventDate: normalizeEventDate(parsed.eventDate),
    content: validateEntryPayload(parsed.content as PostEntryDocument),
  };
}
