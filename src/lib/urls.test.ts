import { describe, expect, it } from "vitest";
import { isSafePrototypeUrl, sanitizePrototypeUrl } from "@/lib/urls";

describe("prototype URLs", () => {
  it("accepts https Figma links", () => {
    expect(isSafePrototypeUrl("https://www.figma.com/file/abc")).toBe(true);
  });

  it("rejects javascript and data URLs", () => {
    expect(isSafePrototypeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafePrototypeUrl("data:text/html,hi")).toBe(false);
  });

  it("rejects localhost and credentialed URLs", () => {
    expect(isSafePrototypeUrl("https://localhost/x")).toBe(false);
    expect(isSafePrototypeUrl("https://user:pass@figma.com/x")).toBe(false);
  });

  it("rejects arbitrary hosts", () => {
    expect(() => sanitizePrototypeUrl("https://evil.example/phish")).toThrow();
  });
});
