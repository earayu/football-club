"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { PostEntryDocument } from "@/lib/posts/document";
import { normalizeInitialDocument, postEditorSchema } from "@/components/posts/editor/post-editor-schema";

export function RichContentView({
  document,
}: {
  document: PostEntryDocument;
}) {
  const editor = useCreateBlockNote(
    {
      schema: postEditorSchema,
      initialContent: normalizeInitialDocument(document),
    },
    [document]
  );

  return (
    <BlockNoteView
      editor={editor}
      editable={false}
      formattingToolbar={false}
      linkToolbar={false}
      slashMenu={false}
      sideMenu={false}
      filePanel={false}
      tableHandles={false}
      emojiPicker={false}
      comments={false}
      className="post-rich-view rounded-2xl"
    />
  );
}
