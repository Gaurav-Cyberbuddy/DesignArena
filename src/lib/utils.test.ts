import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/utils";

describe("safe redirects", () => {
  it("allows in-app paths", () => {
    expect(safeRedirectPath("/vote")).toBe("/vote");
  });

  it("rejects open redirects", () => {
    expect(safeRedirectPath("https://evil.test")).toBe("/");
    expect(safeRedirectPath("//evil.test")).toBe("/");
    expect(safeRedirectPath("\\evil")).toBe("/");
  });
});
