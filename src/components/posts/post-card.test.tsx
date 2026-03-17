import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostCard, type PostData } from "@/components/posts/post-card";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/posts/rich-content-view-lazy", () => ({
  RichContentView: () => <div data-testid="rich-content-view" />,
}));

const baseDate = "2026-03-17T10:00:00.000Z";

describe("PostCard", () => {
  it("renders the append button for signed-in users", () => {
    const post: PostData = {
      id: "post-1",
      title: "周末训练",
      location: null,
      event_date: baseDate,
      is_pinned: false,
      created_by: "user-1",
      created_at: baseDate,
      updated_at: baseDate,
      profiles: { display_name: "A", avatar_url: null },
      post_entries: [
        {
          id: "entry-1",
          post_id: "post-1",
          author_id: "user-1",
          sort_order: 0,
          created_at: baseDate,
          profiles: { display_name: "A", avatar_url: null },
          content: [
            {
              id: "paragraph-1",
              type: "paragraph",
              props: {
                backgroundColor: "default",
                textColor: "default",
                textAlignment: "left",
              },
              content: [{ type: "text", text: "今天训练顺利", styles: {} }],
              children: [],
            },
          ],
        },
      ],
    };

    render(
      <PostCard
        post={post}
        currentUserId="user-1"
        isAdmin={false}
        clubId="club-1"
        currentUserAvatarUrl={null}
        currentUserInitial="A"
      />
    );

    expect(screen.getByText("补充内容")).toBeInTheDocument();
  });

  it("renders entry summaries for appended content", () => {
    const post: PostData = {
      id: "post-1",
      title: "周末训练",
      location: null,
      event_date: baseDate,
      is_pinned: false,
      created_by: "user-1",
      created_at: baseDate,
      updated_at: baseDate,
      profiles: { display_name: "A", avatar_url: null },
      post_entries: [
        {
          id: "entry-1",
          post_id: "post-1",
          author_id: "user-1",
          sort_order: 0,
          created_at: baseDate,
          profiles: { display_name: "A", avatar_url: null },
          content: [
            {
              id: "paragraph-1",
              type: "paragraph",
              props: {
                backgroundColor: "default",
                textColor: "default",
                textAlignment: "left",
              },
              content: [{ type: "text", text: "今天训练顺利", styles: {} }],
              children: [],
            },
          ],
        },
        {
          id: "entry-2",
          post_id: "post-1",
          author_id: "user-2",
          sort_order: 1,
          created_at: baseDate,
          profiles: { display_name: "B", avatar_url: null },
          content: [
            {
              id: "image-1",
              type: "image",
              props: { url: "https://cdn.example.com/1.jpg" },
              content: undefined,
              children: [],
            },
            {
              id: "image-2",
              type: "image",
              props: { url: "https://cdn.example.com/2.jpg" },
              content: undefined,
              children: [],
            },
          ],
        },
      ],
    };

    render(
      <PostCard
        post={post}
        currentUserId="user-1"
        isAdmin={false}
        clubId="club-1"
        currentUserAvatarUrl={null}
        currentUserInitial="A"
      />
    );

    expect(screen.getByText("补充了 2 张照片")).toBeInTheDocument();
  });
});
