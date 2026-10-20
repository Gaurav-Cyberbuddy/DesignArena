const ALLOWED_PROTOCOLS = new Set(["https:"]);
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

const ALLOWED_HOST_SUFFIXES = [
  "figma.com",
  "www.figma.com",
  "behance.net",
  "www.behance.net",
  "dribbble.com",
  "www.dribbble.com",
  "notion.so",
  "www.notion.so",
  "adobe.com",
  "www.adobe.com",
  "xd.adobe.com",
  "framer.com",
  "www.framer.com",
  "webflow.io",
  "www.webflow.io",
  "readymag.com",
  "www.readymag.com",
  "cargo.site",
];

export function isSafePrototypeUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (value.length > 500) return false;
  if (/[\s<>'"\\]/.test(value)) return false;
  if (/^(javascript|data|vbscript|file):/i.test(value)) return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return false;
  if (url.username || url.password) return false;
  if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) return false;
  if (url.hostname === "" || url.hostname.includes(" ")) return false;

  const host = url.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export function sanitizePrototypeUrl(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  if (!isSafePrototypeUrl(raw)) {
    throw new Error("Prototype URL must be an https link to an allowed host.");
  }
  return new URL(raw.trim()).toString();
}
