import { describe, expect, it } from "vitest";
import { validateUpload } from "@/lib/files";

function png(size = 32) {
  const bytes = new Uint8Array(size);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return bytes;
}

function pdf() {
  const bytes = new Uint8Array(16);
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
  return bytes;
}

describe("upload validation", () => {
  it("accepts a matching PNG", () => {
    const result = validateUpload({
      kind: "primary",
      filename: "poster.png",
      mime: "image/png",
      size: 32,
      bytes: png(),
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a renamed executable pretending to be a PNG", () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    const result = validateUpload({
      kind: "primary",
      filename: "evil.png",
      mime: "image/png",
      size: bytes.length,
      bytes,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects oversized primary files", () => {
    const result = validateUpload({
      kind: "primary",
      filename: "huge.png",
      mime: "image/png",
      size: 11 * 1024 * 1024,
      bytes: png(),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a PDF submitted as the primary image", () => {
    const result = validateUpload({
      kind: "primary",
      filename: "notes.pdf",
      mime: "application/pdf",
      size: 16,
      bytes: pdf(),
    });
    expect(result.ok).toBe(false);
  });
});
