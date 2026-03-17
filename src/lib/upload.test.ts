import { describe, expect, it } from "vitest";
import { validateMediaFile, validateMediaFiles } from "@/lib/upload";

function makeFile(name: string, type: string, size: number) {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateMediaFile", () => {
  it("rejects oversized images", () => {
    const file = makeFile("cover.jpg", "image/jpeg", 21 * 1024 * 1024);

    expect(validateMediaFile(file)).toMatchObject({
      ok: false,
      kind: "image",
    });
  });

  it("rejects oversized videos", () => {
    const file = makeFile("clip.mp4", "video/mp4", 101 * 1024 * 1024);

    expect(validateMediaFile(file)).toMatchObject({
      ok: false,
      kind: "video",
    });
  });

  it("rejects unsupported file types", () => {
    const file = makeFile("report.pdf", "application/pdf", 1000);

    expect(validateMediaFile(file)).toMatchObject({
      ok: false,
      kind: "unknown",
    });
  });

  it("accepts supported images and videos", () => {
    expect(validateMediaFile(makeFile("cover.jpg", "image/jpeg", 5 * 1024 * 1024))).toMatchObject({
      ok: true,
      kind: "image",
    });
    expect(validateMediaFile(makeFile("clip.mp4", "video/mp4", 40 * 1024 * 1024))).toMatchObject({
      ok: true,
      kind: "video",
    });
  });
});

describe("validateMediaFiles", () => {
  it("splits valid files and errors", () => {
    const files = [
      makeFile("cover.jpg", "image/jpeg", 5 * 1024 * 1024),
      makeFile("report.pdf", "application/pdf", 1000),
    ];

    const result = validateMediaFiles(files);

    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.valid[0].name).toBe("cover.jpg");
  });
});
