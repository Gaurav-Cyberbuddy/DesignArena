import type { SubmissionStatus } from "@/lib/types";

export const PRIMARY_MAX_BYTES = 10 * 1024 * 1024;
export const SUPPORTING_MAX_BYTES = 15 * 1024 * 1024;

export const PRIMARY_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const PRIMARY_EXT = new Set(["png", "jpg", "jpeg", "webp"]);
export const SUPPORTING_MIME = new Set(["application/pdf"]);
export const SUPPORTING_EXT = new Set(["pdf"]);

const MAGIC = {
  png: [0x89, 0x50, 0x4e, 0x47],
  jpg: [0xff, 0xd8, 0xff],
  webp: [0x52, 0x49, 0x46, 0x46],
  pdf: [0x25, 0x50, 0x44, 0x46],
};

export type FileKind = "primary" | "supporting";

export function extensionOf(name: string) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop()! : "";
}

export function sniffKind(bytes: Uint8Array): "png" | "jpg" | "webp" | "pdf" | null {
  if (startsWith(bytes, MAGIC.png)) return "png";
  if (startsWith(bytes, MAGIC.jpg)) return "jpg";
  if (startsWith(bytes, MAGIC.pdf)) return "pdf";
  if (
    startsWith(bytes, MAGIC.webp) &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function startsWith(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((b, i) => bytes[i] === b);
}

export function validateUpload(input: {
  kind: FileKind;
  filename: string;
  mime: string;
  size: number;
  bytes: Uint8Array;
}): { ok: true; ext: string } | { ok: false; error: string } {
  const ext = extensionOf(input.filename);
  const sniffed = sniffKind(input.bytes);

  if (input.kind === "primary") {
    if (input.size > PRIMARY_MAX_BYTES) {
      return { ok: false, error: "Primary image must be 10 MB or smaller." };
    }
    if (!PRIMARY_EXT.has(ext)) {
      return { ok: false, error: "Primary file must be PNG, JPG, JPEG, or WEBP." };
    }
    if (!PRIMARY_MIME.has(input.mime)) {
      return { ok: false, error: "Primary file MIME type is not allowed." };
    }
    if (!sniffed || sniffed === "pdf") {
      return { ok: false, error: "Primary file contents do not match an allowed image type." };
    }
    if (sniffed === "jpg" && !["jpg", "jpeg"].includes(ext)) {
      return { ok: false, error: "File extension does not match image contents." };
    }
    if (sniffed !== "jpg" && sniffed !== ext) {
      return { ok: false, error: "File extension does not match image contents." };
    }
    return { ok: true, ext: sniffed === "jpg" ? "jpg" : sniffed };
  }

  if (input.size > SUPPORTING_MAX_BYTES) {
    return { ok: false, error: "Supporting file must be 15 MB or smaller." };
  }
  if (!SUPPORTING_EXT.has(ext) || !SUPPORTING_MIME.has(input.mime) || sniffed !== "pdf") {
    return { ok: false, error: "Supporting file must be a valid PDF." };
  }
  return { ok: true, ext: "pdf" };
}

export function isSubmissionId(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export function canAccessSubmissionFile(input: {
  status: SubmissionStatus;
  participantId: string;
  viewerId: string | null | undefined;
  isAdmin: boolean;
}) {
  if (input.isAdmin) return true;
  if (input.viewerId && input.viewerId === input.participantId) return true;
  return input.status === "approved";
}
