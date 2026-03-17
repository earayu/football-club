import { describe, expect, it } from "vitest";
import { parsePreviewFromHtml } from "@/lib/posts/url-preview";

describe("parsePreviewFromHtml", () => {
  it("extracts open graph metadata", () => {
    const html = `
      <html>
        <head>
          <title>Ignored Title</title>
          <meta property="og:title" content="Match Report" />
          <meta property="og:description" content="Big away win" />
          <meta property="og:image" content="https://img.example.com/cover.jpg" />
          <meta property="og:site_name" content="Football Club Portal" />
        </head>
      </html>
    `;

    expect(parsePreviewFromHtml("https://club.example.com/posts/1", html)).toEqual({
      url: "https://club.example.com/posts/1",
      title: "Match Report",
      description: "Big away win",
      image: "https://img.example.com/cover.jpg",
      siteName: "Football Club Portal",
    });
  });

  it("falls back to document title and hostname", () => {
    const html = `
      <html>
        <head>
          <title>Training Notes</title>
        </head>
      </html>
    `;

    expect(parsePreviewFromHtml("https://updates.club.example.com/logs/2", html)).toEqual({
      url: "https://updates.club.example.com/logs/2",
      title: "Training Notes",
      description: "",
      image: "",
      siteName: "updates.club.example.com",
    });
  });

  it("resolves relative image urls against the page url", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Gallery" />
          <meta property="og:image" content="/assets/hero.png" />
        </head>
      </html>
    `;

    expect(parsePreviewFromHtml("https://club.example.com/posts/1", html)).toMatchObject({
      image: "https://club.example.com/assets/hero.png",
    });
  });
});
