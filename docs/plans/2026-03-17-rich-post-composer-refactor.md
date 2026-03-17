# Rich Post Composer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the split post editors with one shared Notion-style composer that supports drag/drop media, pasted screenshots, image/video/webpage URLs, and a rebuilt database model with no legacy compatibility.

**Architecture:** Use `BlockNote` as the client-only editor layer, store one document JSON per contribution in a new `post_entries` table, and render those same documents in read-only mode inside each post card. URL handling becomes a first-class pipeline: classify pasted or dropped URLs into image, video, or link preview blocks, with metadata resolution happening asynchronously through server utilities.

**Tech Stack:** Next.js 16, React 19, Supabase, BlockNote, Vitest, Testing Library, Zod, Cheerio

---

### Task 1: Testing And Editor Foundation

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Step 1: Install the new dependencies**

Run:

```bash
pnpm add @blocknote/core @blocknote/react @blocknote/mantine @mantine/core @mantine/hooks @mantine/utils zod cheerio
```

Expected: install completes without peer dependency failures.

Run:

```bash
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: dev dependencies install cleanly.

**Step 2: Add the testing config**

This is configuration-only work, so it is the explicit exception to TDD for this task.

Implement:

- add `"test": "vitest run"` to `package.json`
- add a `vitest.config.ts` using `environment: "jsdom"`
- add `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`
- set `reactStrictMode: false` in `next.config.ts` for BlockNote compatibility

**Step 3: Run the empty test command**

Run:

```bash
pnpm test
```

Expected: Vitest starts successfully and exits with `No test files found` or equivalent.

**Checkpoint:** Review the diff and continue. Do not create a git commit unless the user explicitly asks.

---

### Task 2: Post Document Utilities

**Files:**
- Create: `src/lib/posts/document.ts`
- Create: `src/lib/posts/document.test.ts`

**Step 1: Write the failing tests**

Create tests for:

- classifying a plain image URL as `"image"`
- classifying a YouTube / Bilibili URL as `"video"`
- classifying a normal webpage URL as `"link"`
- generating entry summaries like `"补充了 2 张照片"` and `"补充了 视频"`

Example:

```ts
import { describe, expect, it } from "vitest";
import {
  classifyExternalUrl,
  summarizeEntryContent,
} from "@/lib/posts/document";

describe("classifyExternalUrl", () => {
  it("classifies image urls", () => {
    expect(classifyExternalUrl("https://cdn.example.com/a.jpg")).toMatchObject({
      kind: "image",
    });
  });

  it("classifies supported video embeds", () => {
    expect(classifyExternalUrl("https://youtu.be/abcdefghijk")).toMatchObject({
      kind: "video",
    });
  });
});

describe("summarizeEntryContent", () => {
  it("summarizes mixed media counts", () => {
    expect(
      summarizeEntryContent([
        { type: "image", props: { url: "https://a.example/1.jpg" } },
        { type: "image", props: { url: "https://a.example/2.jpg" } },
      ] as any)
    ).toBe("补充了 2 张照片");
  });
});
```

**Step 2: Run the tests to watch them fail**

Run:

```bash
pnpm exec vitest run src/lib/posts/document.test.ts
```

Expected: fail because `document.ts` does not exist yet.

**Step 3: Write the minimal implementation**

Implement:

- narrow post document types used by the app
- URL classification helpers
- entry summary helper used by the post card
- small, pure helpers only

**Step 4: Re-run the tests**

Run:

```bash
pnpm exec vitest run src/lib/posts/document.test.ts
```

Expected: all tests pass.

---

### Task 3: URL Preview Resolution

**Files:**
- Create: `src/lib/posts/url-preview.ts`
- Create: `src/lib/posts/url-preview.test.ts`

**Step 1: Write the failing tests**

Test:

- `parsePreviewFromHtml` prefers `og:title`, `og:description`, `og:image`
- it falls back to `<title>`
- it derives `siteName` from the hostname when metadata is missing

Example:

```ts
import { describe, expect, it } from "vitest";
import { parsePreviewFromHtml } from "@/lib/posts/url-preview";

describe("parsePreviewFromHtml", () => {
  it("extracts open graph metadata", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Match Report" />
          <meta property="og:description" content="Big away win" />
          <meta property="og:image" content="https://img.example/cover.jpg" />
        </head>
      </html>
    `;

    expect(parsePreviewFromHtml("https://club.example/post", html)).toMatchObject({
      title: "Match Report",
      description: "Big away win",
      image: "https://img.example/cover.jpg",
    });
  });
});
```

**Step 2: Run the tests to verify RED**

Run:

```bash
pnpm exec vitest run src/lib/posts/url-preview.test.ts
```

Expected: fail because the parser is not implemented yet.

**Step 3: Write the minimal implementation**

Implement:

- HTML metadata extraction with `cheerio`
- fallback logic for missing metadata
- a server-safe `resolveUrlPreview(url)` function that fetches the page and calls the parser
- defensive rejection for non-`http/https` URLs

**Step 4: Re-run the tests**

Run:

```bash
pnpm exec vitest run src/lib/posts/url-preview.test.ts
```

Expected: tests pass.

---

### Task 4: Media Upload Utilities

**Files:**
- Modify: `src/lib/upload.ts`
- Create: `src/lib/upload.test.ts`

**Step 1: Write the failing tests**

Test:

- image files over the image limit are rejected
- video files over the video limit are rejected
- unsupported MIME types are rejected
- supported image and video files pass validation

Example:

```ts
import { describe, expect, it } from "vitest";
import { validateMediaFile } from "@/lib/upload";

describe("validateMediaFile", () => {
  it("rejects oversized videos", () => {
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: 120 * 1024 * 1024 });

    expect(validateMediaFile(file).ok).toBe(false);
  });
});
```

**Step 2: Run the tests to verify RED**

Run:

```bash
pnpm exec vitest run src/lib/upload.test.ts
```

Expected: fail because the new API does not exist.

**Step 3: Write the minimal implementation**

Refactor `src/lib/upload.ts` to expose:

- `validateMediaFile(file)`
- `validateMediaFiles(files)`
- `uploadMediaFileToStorage(file, basePath)`
- image and video size constants

Keep the existing Supabase browser upload approach, but make it generic enough for BlockNote `uploadFile`.

**Step 4: Re-run the tests**

Run:

```bash
pnpm exec vitest run src/lib/upload.test.ts
```

Expected: tests pass.

---

### Task 5: Supabase Schema And Typed Models

**Files:**
- Create: `supabase/migrations/00007_rich_post_entries.sql`
- Modify: `src/lib/types/database.ts`

**Step 1: Write the migration**

Implement a migration that:

- drops `post_block_items`
- drops `post_blocks`
- adds `updated_at` to `posts`
- creates `post_entries`
- creates indexes and RLS policies for `post_entries`

SQL sketch:

```sql
create table public.post_entries (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  sort_order int not null,
  content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
```

**Step 2: Update generated-ish local types manually**

Replace the old `post_blocks` / `post_block_items` table definitions in `src/lib/types/database.ts` with:

- `post_entries`
- updated `posts` row / insert / update shape

**Step 3: Validate the migration syntax**

Run:

```bash
pnpm lint
```

Expected: TypeScript-facing files still lint cleanly after type updates.

---

### Task 6: Shared Editor Schema And Read-Only Viewer

**Files:**
- Create: `src/components/posts/editor/post-editor-schema.tsx`
- Create: `src/components/posts/rich-content-view.tsx`
- Create: `src/components/posts/rich-content-view.test.tsx`

**Step 1: Write the failing component test**

Test:

- a loaded `linkPreview` block renders title and hostname
- a loading `linkPreview` block renders loading state

Example:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkPreviewCard } from "@/components/posts/editor/post-editor-schema";

describe("LinkPreviewCard", () => {
  it("renders preview metadata", () => {
    render(
      <LinkPreviewCard
        url="https://club.example/post"
        title="Match Report"
        description="Big away win"
        siteName="club.example"
        status="ready"
      />
    );

    expect(screen.getByText("Match Report")).toBeInTheDocument();
  });
});
```

**Step 2: Run the test to verify RED**

Run:

```bash
pnpm exec vitest run src/components/posts/rich-content-view.test.tsx
```

Expected: fail because the shared schema does not exist.

**Step 3: Implement the editor schema**

Implement:

- BlockNote schema with a custom `linkPreview` block
- shared block renderer UI
- read-only `RichContentView` wrapper for rendering stored documents inside cards

**Step 4: Re-run the test**

Run:

```bash
pnpm exec vitest run src/components/posts/rich-content-view.test.tsx
```

Expected: pass.

---

### Task 7: Shared Composer And Post Actions

**Files:**
- Create: `src/components/posts/post-composer.tsx`
- Modify: `src/lib/actions/posts.ts`
- Create: `src/lib/actions/url-preview.ts`
- Create: `src/lib/actions/post-payloads.ts`
- Create: `src/lib/actions/post-payloads.test.ts`

**Step 1: Write the failing payload validation tests**

Test:

- create mode requires non-empty content
- append mode requires non-empty content
- empty documents are rejected
- valid documents pass through unchanged

Example:

```ts
import { describe, expect, it } from "vitest";
import { validateEntryPayload } from "@/lib/actions/post-payloads";

describe("validateEntryPayload", () => {
  it("rejects empty documents", () => {
    expect(() => validateEntryPayload([])).toThrow(/empty/i);
  });
});
```

**Step 2: Run the tests to verify RED**

Run:

```bash
pnpm exec vitest run src/lib/actions/post-payloads.test.ts
```

Expected: fail because the validator does not exist.

**Step 3: Implement the validators**

Use `zod` to validate:

- entry document payloads
- create post metadata
- append payloads

**Step 4: Re-run the tests**

Run:

```bash
pnpm exec vitest run src/lib/actions/post-payloads.test.ts
```

Expected: pass.

**Step 5: Rewrite the actions**

Replace the old block/item actions with:

- `createPost(clubId, meta, content)`
- `appendPostEntry(postId, content)`
- `deletePostEntry(entryId)`
- `togglePinPost(postId, isPinned)`
- `resolveDroppedUrl(url)`

Rules:

- create mode inserts a post plus entry `sort_order = 0`
- append mode inserts the next `post_entries.sort_order`
- deleting an appended entry only removes that row

**Step 6: Build the shared composer**

Implement one component that:

- hosts the BlockNote editor
- handles create vs append mode
- uploads files through the shared upload util
- intercepts pasted URLs and dropped URLs
- inserts loading link preview blocks, then resolves them asynchronously

---

### Task 8: Feed Rewrite, Cleanup, And Verification

**Files:**
- Modify: `src/app/[locale]/club/[slug]/page.tsx`
- Modify: `src/components/posts/post-card.tsx`
- Delete: `src/components/posts/block-editor.tsx`
- Delete: `src/components/posts/new-post-form.tsx`
- Delete: `src/components/posts/video-embed.tsx`
- Delete: `src/components/posts/post-photo-grid.tsx`
- Create: `src/components/posts/post-card.test.tsx`

**Step 1: Write the failing post card test**

Test:

- create mode button renders at the top of the feed
- append mode button renders per post
- entry summaries render from `post_entries.content`

Example:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostCard } from "@/components/posts/post-card";

describe("PostCard", () => {
  it("renders append button for signed-in users", () => {
    render(
      <PostCard
        post={{
          id: "post-1",
          title: "训练",
          location: null,
          event_date: new Date().toISOString(),
          is_pinned: false,
          created_by: "user-1",
          created_at: new Date().toISOString(),
          profiles: { display_name: "A", avatar_url: null },
          post_entries: [],
        } as any}
        currentUserId="user-1"
        isAdmin={false}
        clubId="club-1"
        clubSlug="foobar"
      />
    );

    expect(screen.getByText("补充内容")).toBeInTheDocument();
  });
});
```

**Step 2: Run the test to verify RED**

Run:

```bash
pnpm exec vitest run src/components/posts/post-card.test.tsx
```

Expected: fail because the new props and data shape are not wired up yet.

**Step 3: Rewrite the feed**

Implement:

- new nested Supabase select for `post_entries`
- top-level shared composer in create mode
- post card using `RichContentView`
- append composer using the same component in append mode
- delete entry and delete post affordances

**Step 4: Remove obsolete code**

Delete the old editor and block renderer files once imports are clean.

**Step 5: Run the full verification suite**

Run:

```bash
pnpm test
```

Expected: all tests pass.

Run:

```bash
pnpm lint
```

Expected: no lint errors.

Run:

```bash
pnpm build
```

Expected: production build succeeds.

**Checkpoint:** Review the final diff with `git status` and `git diff`. Only commit if the user explicitly requests it.
