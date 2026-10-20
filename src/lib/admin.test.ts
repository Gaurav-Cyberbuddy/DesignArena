import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin";

describe("admin emails", () => {
  it("parses a comma-separated allow list", () => {
    expect(parseAdminEmails("A@College.edu, b@college.edu")).toEqual([
      "a@college.edu",
      "b@college.edu",
    ]);
  });

  it("never treats a missing email as admin", () => {
    expect(isAdminEmail(null, "a@b.com")).toBe(false);
    expect(isAdminEmail("a@b.com", "")).toBe(false);
  });
});
