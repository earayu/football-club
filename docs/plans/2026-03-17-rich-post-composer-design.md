# Rich Post Composer Design

**Date:** 2026-03-17  
**Status:** Approved

---

## Goal

Replace the current split post editors with one shared, block-based composer that supports:

- dragging local images and videos into the editor
- pasting screenshots and media files
- pasting or dropping image / video / webpage URLs
- automatic URL parsing and inline expansion
- the same interaction model for both "发布" and "补充内容"

Old post content does **not** need compatibility. The database can be rebuilt around the new model.

---

## Why The Current Design Fails

The current page has two different editors:

- `BlockEditor` for top-level post creation
- `AppendEditor` for post append flows

They implement different state models, different paste/drop behavior, and different submission pipelines. That divergence is the root cause of the current bugs:

- top composer and append composer behave differently
- append only supports one video because it has a single `videoUrl` state
- URL parsing only runs when the textarea is empty
- media mixed between text segments is treated as plain text instead of structured content

Fixing these one-by-one would keep the architecture brittle.

---

## Product Decisions

### 1. One shared composer

Both "发布" and "补充内容" will use the same client component:

- `create` mode: creates a new post plus its first content entry
- `append` mode: adds a new content entry to an existing post

Only the surrounding metadata differs:

- create mode shows title / location / event date
- append mode only edits content

### 2. Block editor foundation

Use `BlockNote` as the editor foundation because it is the closest match to Notion-style block editing and already supports block-oriented media insertion, custom blocks, and client-side file upload hooks.

Important implementation note:

- the app runs on React 19 / Next 16
- BlockNote currently requires `reactStrictMode: false` in Next.js according to its docs

That change is acceptable for this refactor.

### 3. Store entries, not per-item rows

Replace the current `post_blocks` + `post_block_items` model with a simpler structure:

- `posts`: post metadata
- `post_entries`: one submitted editor document per contribution

This keeps append attribution natural:

- the initial publish is entry `sort_order = 0`
- every later append is one more entry
- each entry has one author, one timestamp, and one block document

### 4. No legacy compatibility

The old schema can be dropped outright:

- remove `post_blocks`
- remove `post_block_items`
- rebuild the page against the new `post_entries.content` JSON document

No migration layer is needed for existing post content.

---

## Data Model

### `posts`

Keep the existing metadata-oriented table and add `updated_at` for cleaner bookkeeping:

- `id`
- `club_id`
- `title`
- `location`
- `event_date`
- `is_pinned`
- `created_by`
- `created_at`
- `updated_at`

### `post_entries`

New table:

- `id`
- `post_id`
- `author_id`
- `sort_order`
- `content jsonb`
- `created_at`

`content` stores the BlockNote document JSON for one contribution.

### Permissions

- public can read posts and entries
- active members can create posts and append entries
- post creator or admin can delete the full post
- entry author or admin can delete appended entries
- initial entry (`sort_order = 0`) is not deleted independently; deleting the post removes it

---

## Editor Schema

The editor will allow a constrained set of blocks that match the product:

- paragraph / rich text
- image
- video
- custom `linkPreview`

The custom `linkPreview` block stores:

- `url`
- `title`
- `description`
- `image`
- `siteName`
- `status`

`status` supports a loading-first UX:

- URL is pasted or dropped
- placeholder card is inserted immediately
- metadata is resolved asynchronously
- the existing block is updated in place

---

## URL Parsing Rules

When the user pastes or drops a URL:

1. direct image URL → image block
2. direct video URL or supported embed URL → video block
3. normal webpage URL → `linkPreview` card

This must work even when the cursor is in the middle of text. The editor should insert a structured block at the current position instead of only handling empty-editor cases.

---

## Upload Model

BlockNote uploads files at insertion time, before the post necessarily exists, so uploads will go to a draft path:

- `posts/{clubId}/drafts/{sessionId}/...`

This is simpler and more reliable than delaying all uploads until submit.

Supported local files:

- image files
- video files

Validation rules will live in a shared upload utility with per-type size limits.

---

## Rendering Strategy

The feed will keep the current card-based layout, but each entry body will render through the same editor schema in read-only mode.

Benefits:

- no second renderer to keep in sync
- the same block types work in composer and viewer
- custom link cards render consistently everywhere

Each post card will show:

- post metadata header
- entry list in chronological order
- per-entry attribution ("X 补充了文字 / 图片 / 视频 / 链接")
- shared append composer

---

## Testing Strategy

Add a real test stack before implementation:

- `vitest`
- `jsdom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`

Primary test coverage:

- URL classification and preview fallback behavior
- BlockNote document summarization for entry attribution
- upload validation rules
- post action payload validation
- card rendering of entry summaries and delete affordances

The editor library itself is trusted; our tests focus on the app-specific behavior layered on top of it.

---

## Success Criteria

The refactor is successful when:

- top publish and post append use the same composer
- dragging images or videos works in both places
- pasting screenshots works
- pasting image / video / webpage URLs expands into structured content
- multiple videos are supported
- pasting a URL between text blocks still creates a structured block
- old `post_blocks` / `post_block_items` code is fully removed
