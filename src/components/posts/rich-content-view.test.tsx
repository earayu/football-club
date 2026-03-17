import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkPreviewCard } from "@/components/posts/editor/post-editor-schema";

describe("LinkPreviewCard", () => {
  it("renders loaded preview metadata", () => {
    render(
      <LinkPreviewCard
        url="https://club.example.com/posts/1"
        title="Match Report"
        description="Big away win"
        image="https://img.example.com/cover.jpg"
        siteName="club.example.com"
        status="ready"
      />
    );

    expect(screen.getByText("Match Report")).toBeInTheDocument();
    expect(screen.getByText("Big away win")).toBeInTheDocument();
    expect(screen.getByText("club.example.com")).toBeInTheDocument();
  });

  it("renders a loading state before metadata resolves", () => {
    render(
      <LinkPreviewCard
        url="https://club.example.com/posts/1"
        title=""
        description=""
        image=""
        siteName="club.example.com"
        status="loading"
      />
    );

    expect(screen.getByText("正在解析链接...")).toBeInTheDocument();
    expect(screen.getByText("club.example.com")).toBeInTheDocument();
  });
});
